pub mod config;
pub mod models;
pub mod telemetry;
pub mod analyzer;
pub mod consumer;

use opentelemetry::global;
use opentelemetry::trace::TracerProvider;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cfg = config::Config::load();

    let tracer = match telemetry::init_tracer(&cfg.otel_endpoint) {
        Ok(t) => t,
        Err(e) => {
            eprintln!("Warning: Failed to initialize OpenTelemetry tracer: {}. Falling back to local SDK tracer.", e);
            opentelemetry_sdk::trace::TracerProvider::default().tracer("analyst-agent")
        }
    };

    consumer::run(&cfg.redis_url, tracer).await?;

    global::shutdown_tracer_provider();
    Ok(())
}
