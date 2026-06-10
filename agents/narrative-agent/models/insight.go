package models

type InsightBundle struct {
	InsightType   string `json:"insight_type"`
	Description   string `json:"description"`
	EventCount    int    `json:"event_count"`
	SourceTraceID string `json:"source_trace_id"`
	Timestamp     int64  `json:"timestamp"`
}

type NarrativeResponse struct {
	Insight   InsightBundle `json:"insight"`
	Narrative string        `json:"narrative"`
}
