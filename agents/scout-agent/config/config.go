package config

import (
	"log"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	NovusMcpEndpoint string
	RedisAddr        string
	OtelEndpoint     string
	PollInterval     time.Duration
	AgentID          string
}

func Load() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	redisAddr := strings.TrimSpace(os.Getenv("REDIS_ADDR"))
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	otelEndpoint := strings.TrimSpace(os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT"))
	if otelEndpoint == "" {
		otelEndpoint = "localhost:4317"
	}

	mcpEndpoint := strings.TrimSpace(os.Getenv("NOVUS_MCP_ENDPOINT"))
	if mcpEndpoint == "" {
		mcpEndpoint = "https://novus-api.pendo.io/mcp"
	}

	pollIntervalStr := strings.TrimSpace(os.Getenv("POLL_INTERVAL"))
	pollInterval, err := time.ParseDuration(pollIntervalStr)
	if err != nil || pollInterval == 0 {
		pollInterval = 5 * time.Minute // default to 5 minutes
	}

	agentID := strings.TrimSpace(os.Getenv("AGENT_ID"))
	if agentID == "" {
		agentID = "agent-001" // default telemetry agent ID
	}

	return &Config{
		NovusMcpEndpoint: mcpEndpoint,
		RedisAddr:        redisAddr,
		OtelEndpoint:     otelEndpoint,
		PollInterval:     pollInterval,
		AgentID:          agentID,
	}
}
