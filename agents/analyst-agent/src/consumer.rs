use redis::AsyncCommands;
use redis::streams::{StreamReadOptions, StreamReadReply};
use opentelemetry::trace::{TraceContextExt, Tracer, TraceId, SpanId, SpanContext, TraceFlags, TraceState, Span};
use opentelemetry::Context;
use std::time::Duration;

use crate::models::RawPayload;
use crate::analyzer::Analyzer;

pub async fn run(redis_url: &str, tracer: opentelemetry_sdk::trace::Tracer) -> Result<(), Box<dyn std::error::Error>> {
    let client = redis::Client::open(redis_url)?;
    let mut con = client.get_tokio_connection().await?;
    let mut pub_con = client.get_tokio_connection().await?;

    let stream = "lore:stream:raw";
    let group = "scout_processors";
    let consumer = "analyst_1";

    let _ : redis::RedisResult<()> = con.xgroup_create_mkstream(stream, group, "0").await;

    let mut analyzer = Analyzer::new();

    println!("Analyst Agent started. Waiting for events...");

    loop {
        let opts = StreamReadOptions::default().group(group, consumer).block(5000).count(10);
        let reply: redis::RedisResult<StreamReadReply> = con.xread_options(&[stream], &[">"], &opts).await;

        match reply {
            Ok(stream_reply) => {
                for key in stream_reply.keys {
                    for id in key.ids {
                        if let Some(payload_str) = id.map.get("payload") {
                            if let redis::Value::Data(data) = payload_str {
                                if let Ok(s) = std::str::from_utf8(data) {
                                    if let Ok(payload) = serde_json::from_str::<RawPayload>(s) {
                                        let trace_id_str = payload.metadata.telemetry.trace_id;
                                        
                                        println!("Processing event: {} with trace: {}", payload.event, trace_id_str);

                                        let mut span = tracer.start("analyze_novus_event");
                                        if let Ok(trace_id_otel) = TraceId::from_hex(trace_id_str) {
                                            let span_context = SpanContext::new(trace_id_otel, SpanId::INVALID, TraceFlags::default(), false, TraceState::default());
                                            let parent_cx = Context::current().with_remote_span_context(span_context);
                                            span = tracer.start_with_context("analyze_novus_event", &parent_cx);
                                        }
                                        
                                        if let Some(insight) = analyzer.process_event(payload.event, trace_id_str) {
                                            println!("Insight Generated: {:?}", insight);
                                            let insight_json = serde_json::to_string(&insight)?;
                                            let _: () = pub_con.xadd("lore:stream:insights", "*", &[("payload", insight_json)]).await?;
                                        }

                                        span.end();
                                    }
                                }
                            }
                        }
                        let _: () = con.xack(stream, group, &[id.id]).await?;
                    }
                }
            }
            Err(e) => {
                eprintln!("Redis read error: {}", e);
                tokio::time::sleep(Duration::from_secs(2)).await;
            }
        }
    }
}
