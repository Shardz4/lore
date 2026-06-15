package novus

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/mark3labs/mcp-go/client"
	"github.com/mark3labs/mcp-go/mcp"
	"lore/scout-agent/models"
)

type MCPClient struct {
	mcpClient client.MCPClient
	endpoint  string
}

func NewMCPClient(endpoint string) *MCPClient {
	return &MCPClient{
		endpoint: endpoint,
	}
}

func (c *MCPClient) Connect(ctx context.Context) error {
	sseClient, err := client.NewSSEMCPClient(c.endpoint)
	if err != nil {
		return err
	}

	err = sseClient.Start(ctx)
	if err != nil {
		return err
	}

	c.mcpClient = sseClient

	initRequest := mcp.InitializeRequest{}
	initRequest.Params.ProtocolVersion = mcp.LATEST_PROTOCOL_VERSION
	initRequest.Params.ClientInfo = mcp.Implementation{
		Name:    "scout-agent",
		Version: "1.0.0",
	}

	_, err = c.mcpClient.Initialize(ctx, initRequest)
	if err != nil {
		return err
	}

	return nil
}

func (c *MCPClient) FetchBehavioralData(ctx context.Context, traceID string, agentID string) (models.Payload, error) {
	if c.mcpClient == nil {
		return models.Payload{}, fmt.Errorf("mcp client not connected")
	}

	// Requesting data from Novus using a hypothetical tool name
	toolCallReq := mcp.CallToolRequest{}
	toolCallReq.Params.Name = "get_behavioral_events"
	toolCallReq.Params.Arguments = map[string]interface{}{}

	resp, err := c.mcpClient.CallTool(ctx, toolCallReq)
	if err != nil {
		return models.Payload{}, fmt.Errorf("mcp tool call failed: %w", err)
	}

	if resp.IsError {
		return models.Payload{}, fmt.Errorf("mcp tool call returned error response")
	}

	var rawData map[string]any
	if len(resp.Content) > 0 {
		if textContent, ok := resp.Content[0].(mcp.TextContent); ok {
			json.Unmarshal([]byte(textContent.Text), &rawData)
		}
	}

	return models.Payload{
		Event: "novus_event",
		Metadata: models.PayloadMetadata{
			Timestamp: time.Now().UnixMilli(),
			Telemetry: models.TelemetryInfo{
				TraceID: traceID,
				AgentID: agentID,
			},
		},
		Data: rawData,
	}, nil
}
