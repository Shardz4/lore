package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	RedisURL     string
	GeminiAPIKey string
	ServerPort   string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}
	redisURL = strings.ReplaceAll(redisURL, "$$", "$")

	geminiKey := os.Getenv("GEMINI_API_KEY")

	serverPort := os.Getenv("SERVER_PORT")
	if serverPort == "" {
		serverPort = "8080"
	}

	return &Config{
		RedisURL:     redisURL,
		GeminiAPIKey: geminiKey,
		ServerPort:   serverPort,
	}
}
