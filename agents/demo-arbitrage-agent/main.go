package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
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
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://default:EYYYwImpcEWRdSKBLXWTZEkMHyCsMaXS@switchyard.proxy.rlwy.net:44176"
	}
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatalf("Failed to parse Redis URL: %v", err)
	}
	rdb := redis.NewClient(opts)
	defer rdb.Close()

	agentID := os.Getenv("AGENT_ID")
	if agentID == "" {
		agentID = "arbitrage-scout-01"
	}
	log.Printf("Arbitrage Scout Agent (%s) started. Polling price feed...", agentID)

	rand.Seed(time.Now().UnixNano())

	cycle := 1
	for {
		ctx := context.Background()
		traceID := fmt.Sprintf("t-arb-%d", time.Now().UnixNano())
		
		var event string
		var price float64
		
		if cycle%5 == 0 {
			event = "hallucination"
			price = 0.01
			log.Printf("[CYCLE %d] ⚠️ SIMULATING PRICING ANOMALY: Price crashed to $%f!", cycle, price)
		} else {
			event = "price_update"
			price = 1.00 + (rand.Float64() * 0.05)
			log.Printf("[CYCLE %d] Reporting normal price: $%f", cycle, price)
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
				"token": "LORE/USDC",
				"price": price,
			},
		}

		data, err := json.Marshal(payload)
		if err != nil {
			log.Printf("Failed to marshal payload: %v", err)
			continue
		}

		_, err = rdb.XAdd(ctx, &redis.XAddArgs{
			Stream: "lore:stream:raw",
			Values: map[string]interface{}{
				"payload": string(data),
			},
		}).Result()
		
		if err != nil {
			log.Printf("Failed to publish to Redis: %v", err)
		} else {
			log.Printf("Successfully published event '%s' (Trace: %s)", event, traceID)
		}

		cycle++
		time.Sleep(5 * time.Second)
	}
}
