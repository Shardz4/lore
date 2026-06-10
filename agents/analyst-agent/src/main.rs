pub mod config;
pub mod models;
pub mod telemetry;
pub mod analyzer;
pub mod consumer;

use opentelemetry::global;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cfg = config::Config::load();

    let tracer = telemetry::init_tracer(&cfg.otel_endpoint)?;

    consumer::run(&cfg.redis_url, tracer).await?;

    global::shutdown_tracer_provider();
    Ok(())
}
