package config

import (
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	NovusMcpEndpoint string
	RedisAddr        string
	OtelEndpoint     string
	PollInterval     time.Duration
}

func Load() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	otelEndpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
	if otelEndpoint == "" {
		otelEndpoint = "localhost:4317"
	}

	mcpEndpoint := os.Getenv("NOVUS_MCP_ENDPOINT")
	if mcpEndpoint == "" {
		mcpEndpoint = "https://novus-api.pendo.io/mcp"
	}

	pollIntervalStr := os.Getenv("POLL_INTERVAL")
	pollInterval, err := time.ParseDuration(pollIntervalStr)
	if err != nil || pollInterval == 0 {
		pollInterval = 5 * time.Minute // default to 5 minutes
	}

	return &Config{
		NovusMcpEndpoint: mcpEndpoint,
		RedisAddr:        redisAddr,
		OtelEndpoint:     otelEndpoint,
		PollInterval:     pollInterval,
	}
}
