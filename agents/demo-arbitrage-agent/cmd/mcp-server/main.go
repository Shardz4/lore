package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"os"
	"sync"
	"time"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

type EventPayload struct {
	Event string         `json:"event"`
	Data  map[string]any `json:"data"`
}

var (
	counter   int
	counterMu sync.Mutex
)

func main() {
	// Seed randomizer
	rand.Seed(time.Now().UnixNano())

	// 1. Create a new MCP Server
	s := server.NewMCPServer(
		"Arbitrage Pricing MCP Server",
		"1.0.0",
	)

	// 2. Define the tool
	tool := mcp.NewTool("get_behavioral_events",
		mcp.WithDescription("Fetch the latest token pricing behavioral events"),
	)

	// 3. Register the tool with a handler function
	s.AddTool(tool, handleGetBehavioralEvents)

	// 4. Create the SSE HTTP handler
	sse := server.NewSSEServer(s)

	// 5. Start the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}
	log.Printf("Starting Price Feed SSE MCP Server on :%s\n", port)
	log.Printf("SSE Stream endpoint: http://localhost:%s/sse\n", port)
	log.Printf("Message endpoint: http://localhost:%s/messages\n", port)

	if err := sse.Start(":" + port); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func handleGetBehavioralEvents(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	counterMu.Lock()
	counter++
	currentCycle := counter
	counterMu.Unlock()

	var payload EventPayload

	// Every 5th request, return a hallucination pricing anomaly
	if currentCycle%5 == 0 {
		log.Printf("[MCP Server] ⚠️ Request %d: Simulating pricing anomaly (hallucination)!", currentCycle)
		payload = EventPayload{
			Event: "hallucination",
			Data: map[string]any{
				"token": "LORE/USDC",
				"price": 0.01,
			},
		}
	} else {
		price := 1.00 + (rand.Float64() * 0.05)
		log.Printf("[MCP Server] Request %d: Reporting normal price: $%f", currentCycle, price)
		payload = EventPayload{
			Event: "price_update",
			Data: map[string]any{
				"token": "LORE/USDC",
				"price": price,
			},
		}
	}

	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("JSON marshal failed: %v", err)), nil
	}

	// Return the JSON string inside a text content object
	return mcp.NewToolResultText(string(jsonBytes)), nil
}
