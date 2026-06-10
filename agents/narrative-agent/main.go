package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/redis/go-redis/v9"
	"lore/narrative-agent/config"
	"lore/narrative-agent/consumer"
	"lore/narrative-agent/dlq"
	"lore/narrative-agent/llm"
	"lore/narrative-agent/server"
)

func main() {
	cfg := config.Load()

	opt, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		log.Fatalf("Invalid Redis URL: %v", err)
	}
	rdb := redis.NewClient(opt)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	llmClient := llm.NewAnthropicClient(cfg.AnthropicAPIKey)
	apiServer := server.NewAPIServer(cfg.ServerPort)
	
	// Start DLQ Sweeper
	sweeper := dlq.NewSweeper(rdb, "lore:stream:insights", "narrative_processors")
	go sweeper.Start(ctx)

	// Start Stream Consumer
	reader := consumer.NewReader(rdb, llmClient, apiServer)
	go reader.Start(ctx)

	// Start API Server
	go func() {
		log.Printf("Starting API server on port %s", cfg.ServerPort)
		if err := apiServer.Start(); err != nil {
			log.Fatalf("API Server failed: %v", err)
		}
	}()

	// Wait for termination signal
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c
	log.Println("Shutting down narrative-agent...")
}
