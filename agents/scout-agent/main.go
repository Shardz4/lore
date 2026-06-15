package main

import (
	"context"
	"log"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"

	"lore/scout-agent/config"
	"lore/scout-agent/novus"
	"lore/scout-agent/redis"
	"lore/scout-agent/telemetry"
)

func main() {
	cfg := config.Load()

	tp, err := telemetry.InitTracer(cfg.OtelEndpoint)
	if err != nil {
		log.Fatalf("Failed to initialize tracer: %v", err)
	}
	defer func() {
		if err := tp.Shutdown(context.Background()); err != nil {
			log.Printf("Error shutting down tracer: %v", err)
		}
	}()

	tracer := otel.Tracer("scout-agent")

	publisher := redis.NewPublisher(cfg.RedisAddr, "lore:stream:raw")
	defer publisher.Close()

	// Initialize the Novus MCP Client
	novusClient := novus.NewMCPClient(cfg.NovusMcpEndpoint)
	
	// Try connecting to Novus MCP Server
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	err = novusClient.Connect(ctx)
	if err != nil {
		log.Printf("Failed to connect to Novus MCP Server: %v", err)
	}
	cancel()

	log.Printf("Scout Agent is starting to poll every %v...", cfg.PollInterval)

	ticker := time.NewTicker(cfg.PollInterval)
	defer ticker.Stop()

	// Run once immediately
	runCycle(tracer, novusClient, publisher, cfg.AgentID)

	for {
		<-ticker.C
		runCycle(tracer, novusClient, publisher, cfg.AgentID)
	}
}

func runCycle(tracer trace.Tracer, novusClient *novus.MCPClient, publisher *redis.Publisher, agentID string) {
	ctx := context.Background()
	// Start a root span for this batch processing
	ctx, span := tracer.Start(ctx, "process_novus_batch")
	defer span.End()

	traceID := span.SpanContext().TraceID().String()
	log.Printf("Processing batch with TraceID: %s", traceID)

	// Fetch from Novus MCP or Generator
	payload, err := novusClient.FetchBehavioralData(ctx, traceID, agentID)
	if err != nil {
		log.Printf("Error fetching data: %v", err)
		span.RecordError(err)
		return
	}

	// Publish to Redis
	if err := publisher.Publish(ctx, payload); err != nil {
		log.Printf("Error publishing to Redis: %v", err)
		span.RecordError(err)
	} else {
		log.Printf("Successfully published payload to Redis")
	}
}
