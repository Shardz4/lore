package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

type Payload struct {
	Event    string          `json:"event"`
	Metadata PayloadMetadata `json:"metadata"`
	Data     map[string]any  `json:"data"`
}

type PayloadMetadata struct {
	Timestamp int64         `json:"timestamp"`
	Telemetry TelemetryInfo `json:"telemetry"`
}

type TelemetryInfo struct {
	TraceID string `json:"trace_id"`
	AgentID string `json:"agent_id"`
}

func main() {
	redisURL := "redis://:K4zR9wP2xY8tM6qB@localhost:6379"
	if envURL := os.Getenv("REDIS_URL"); envURL != "" {
		redisURL = envURL
	}
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatalf("Failed to parse Redis URL: %v", err)
	}
	rdb := redis.NewClient(opts)
	defer rdb.Close()

	event := "hallucination"
	if len(os.Args) > 1 {
		event = os.Args[1]
	}

	agentID := "agent-001"
	if len(os.Args) > 2 {
		agentID = os.Args[2]
	}

	traceID := fmt.Sprintf("t%d", time.Now().UnixNano())
	if len(os.Args) > 3 {
		traceID = os.Args[3]
	}

	payload := Payload{
		Event: event,
		Metadata: PayloadMetadata{
			Timestamp: time.Now().UnixMilli(),
			Telemetry: TelemetryInfo{
				TraceID: traceID,
				AgentID: agentID,
			},
		},
		Data: map[string]any{
			"message": "Simulated test event",
		},
	}

	data, err := json.Marshal(payload)
	if err != nil {
		log.Fatalf("Failed to marshal payload: %v", err)
	}

	ctx := context.Background()
	res, err := rdb.XAdd(ctx, &redis.XAddArgs{
		Stream: "lore:stream:raw",
		Values: map[string]interface{}{
			"payload": string(data),
		},
	}).Result()
	if err != nil {
		log.Fatalf("Failed to publish to Redis: %v", err)
	}

	fmt.Printf("Successfully published event '%s' for agent '%s' (Trace: %s). Redis response: %s\n", event, agentID, traceID, res)
}
