use opentelemetry_sdk::trace::Tracer;
use opentelemetry_otlp::WithExportConfig;
use std::net::ToSocketAddrs;
use std::net::TcpStream;
use std::time::Duration;

pub fn is_reachable(endpoint: &str) -> bool {
    let mut cleaned = endpoint;
    if let Some(pos) = endpoint.find("://") {
        cleaned = &endpoint[pos + 3..];
    }
    if let Some(pos) = cleaned.find('/') {
        cleaned = &cleaned[..pos];
    }

    let addrs = match cleaned.to_socket_addrs() {
        Ok(mut a) => a.next(),
        Err(_) => return false,
    };

    if let Some(addr) = addrs {
        TcpStream::connect_timeout(&addr, Duration::from_millis(300)).is_ok()
    } else {
        false
    }
}

pub fn init_tracer(endpoint: &str) -> Result<Tracer, Box<dyn std::error::Error>> {
    if !is_reachable(endpoint) {
        return Err("OTLP collector endpoint is unreachable".into());
    }

    let exporter = opentelemetry_otlp::new_exporter()
        .tonic()
        .with_endpoint(endpoint);

    let tracer = opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(exporter)
        .with_trace_config(
            opentelemetry_sdk::trace::config()
                .with_resource(opentelemetry_sdk::Resource::new(vec![
                    opentelemetry::KeyValue::new("service.name", "analyst-agent"),
                ])),
        )
        .install_batch(opentelemetry_sdk::runtime::Tokio)?;

    Ok(tracer)
}

