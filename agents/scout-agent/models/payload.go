package models

// Payload represents the outer envelope of the behavioral data.
type Payload struct {
	Event    string          `json:"event"`
	Metadata PayloadMetadata `json:"metadata"`
	Data     map[string]any  `json:"data"`
}

// PayloadMetadata holds metadata including OpenTelemetry trace information.
type PayloadMetadata struct {
	Timestamp int64         `json:"timestamp"`
	Telemetry TelemetryInfo `json:"telemetry"`
}

// TelemetryInfo encapsulates OpenTelemetry trace context.
type TelemetryInfo struct {
	TraceID string `json:"trace_id"`
}
