package novus

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/mark3labs/mcp-go/client"
	"github.com/mark3labs/mcp-go/client/transport"
	"github.com/mark3labs/mcp-go/mcp"
	"lore/scout-agent/models"
)

type MCPClient struct {
	mcpClient    client.MCPClient
	endpoint     string
	clientID     string
	clientSecret string
	appID        string
}

func NewMCPClient(endpoint, clientID, clientSecret, appID string) *MCPClient {
	return &MCPClient{
		endpoint:     endpoint,
		clientID:     clientID,
		clientSecret: clientSecret,
		appID:        appID,
	}
}

type TokenAuthRoundTripper struct {
	token string
	next  http.RoundTripper
}

func (t *TokenAuthRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("Authorization", "Bearer "+t.token)
	return t.next.RoundTrip(req)
}

func (c *MCPClient) mintToken(ctx context.Context) (string, error) {
	if c.clientID == "" || c.clientSecret == "" {
		return "", nil // skip token generation if credentials are not provided (e.g. local dev)
	}

	tokenUrl := "https://novus-api.pendo.io/mcp-auth/token"
	data := url.Values{}
	data.Set("grant_type", "client_credentials")
	data.Set("client_id", c.clientID)
	data.Set("client_secret", c.clientSecret)
	data.Set("app_id", c.appID)

	req, err := http.NewRequestWithContext(ctx, "POST", tokenUrl, strings.NewReader(data.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	httpClient := &http.Client{Timeout: 10 * time.Second}
	resp, err := httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return "", fmt.Errorf("failed to mint token: status %d", resp.StatusCode)
	}

	var res struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return "", err
	}

	return res.AccessToken, nil
}

func (c *MCPClient) Connect(ctx context.Context) error {
	token, err := c.mintToken(ctx)
	if err != nil {
		log.Printf("Warning: failed to mint Novus auth token: %v. Attempting connection without token.", err)
	}

	var options []transport.ClientOption
	if token != "" {
		httpClient := &http.Client{
			Transport: &TokenAuthRoundTripper{
				token: token,
				next:  http.DefaultTransport,
			},
		}
		options = append(options, transport.WithHTTPClient(httpClient))
	}

	sseClient, err := client.NewSSEMCPClient(c.endpoint, options...)
	if err != nil {
		return err
	}

	err = sseClient.Start(context.Background())
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
		log.Println("MCP client not connected. Attempting to reconnect...")
		err := c.Connect(ctx)
		if err != nil {
			return models.Payload{}, fmt.Errorf("mcp client not connected and reconnection failed: %w", err)
		}
		log.Println("Successfully connected to MCP Server!")
	}

	// Requesting data from Novus using a hypothetical tool name
	toolCallReq := mcp.CallToolRequest{}
	toolCallReq.Params.Name = "get_behavioral_events"
	toolCallReq.Params.Arguments = map[string]interface{}{}

	resp, err := c.mcpClient.CallTool(ctx, toolCallReq)
	if err != nil {
		c.mcpClient = nil // Reset client to force reconnection next time
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

	event := "novus_event"
	if customEvent, ok := rawData["event"].(string); ok {
		event = customEvent
	}

	innerData := rawData
	if dataField, ok := rawData["data"].(map[string]any); ok {
		innerData = dataField
	}

	return models.Payload{
		Event: event,
		Metadata: models.PayloadMetadata{
			Timestamp: time.Now().UnixMilli(),
			Telemetry: models.TelemetryInfo{
				TraceID: traceID,
				AgentID: agentID,
			},
		},
		Data: innerData,
	}, nil
}
