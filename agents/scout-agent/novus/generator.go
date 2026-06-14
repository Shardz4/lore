package novus

import (
	"lore/scout-agent/models"
	"time"
)

var deterministicEvents = []string{
	"feature_dropoff",
	"rage_click",
	"login_success",
	"page_load",
}

var callCount = 0

// GenerateMockPayload generates a deterministic payload for fallback purposes.
func GenerateMockPayload(traceID string, agentID string) models.Payload {
	event := deterministicEvents[callCount%len(deterministicEvents)]
	callCount++

	return models.Payload{
		Event: event,
		Metadata: models.PayloadMetadata{
			Timestamp: time.Now().UnixMilli(),
			Telemetry: models.TelemetryInfo{
				TraceID: traceID,
				AgentID: agentID,
			},
		},
		Data: map[string]any{
			"userId":    "user-fallback-123",
			"accountId": "acct-fallback-abc",
			"source":    "novus_mcp_fallback",
			"note":      "This is deterministically generated Novus fallback data.",
		},
	}
}
