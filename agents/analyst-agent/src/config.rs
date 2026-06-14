use std::env;

pub struct Config {
    pub redis_url: String,
    pub otel_endpoint: String,
}

impl Config {
    pub fn load() -> Self {
        let _ = dotenvy::dotenv();

        let mut redis_url = env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string());
        redis_url = redis_url.replace("$$", "$");
        let otel_endpoint = env::var("OTEL_EXPORTER_OTLP_ENDPOINT").unwrap_or_else(|_| "http://localhost:4317".to_string());

        Self {
            redis_url,
            otel_endpoint,
        }
    }
}
