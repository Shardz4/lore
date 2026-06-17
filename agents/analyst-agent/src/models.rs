use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct RawPayload<'a> {
    pub event: &'a str,
    #[serde(borrow)]
    pub metadata: PayloadMetadata<'a>,
}

#[derive(Debug, Deserialize)]
pub struct PayloadMetadata<'a> {
    pub timestamp: i64,
    #[serde(borrow)]
    pub telemetry: TelemetryInfo<'a>,
}

#[derive(Debug, Deserialize)]
pub struct TelemetryInfo<'a> {
    pub trace_id: &'a str,
    pub agent_id: Option<&'a str>,
}

#[derive(Debug, Serialize)]
pub struct InsightBundle {
    pub insight_type: String,
    pub description: String,
    pub event_count: usize,
    pub source_trace_id: String,
    pub agent_id: String,
    pub timestamp: i64,
    pub zk_proof: Option<String>,
}
