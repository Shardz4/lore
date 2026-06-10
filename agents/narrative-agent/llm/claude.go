package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"lore/narrative-agent/models"
)

type AnthropicClient struct {
	apiKey string
	client *http.Client
}

func NewAnthropicClient(apiKey string) *AnthropicClient {
	return &AnthropicClient{
		apiKey: apiKey,
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *AnthropicClient) GenerateSummary(ctx context.Context, insight models.InsightBundle) (string, error) {
	if c.apiKey == "" {
		return "Mock Narrative: Actionable PM summary would appear here if ANTHROPIC_API_KEY was provided.", nil
	}

	prompt := fmt.Sprintf("Act as an expert Product Manager. We detected a %s anomaly. Description: %s. Event count: %d. Provide a concise, actionable summary of what to investigate.", insight.InsightType, insight.Description, insight.EventCount)

	payload := map[string]interface{}{
		"model":      "claude-3-5-sonnet-20240620",
		"max_tokens": 256,
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
	}

	reqBody, _ := json.Marshal(payload)

	var lastErr error
	for attempt := 1; attempt <= 3; attempt++ {
		req, _ := http.NewRequestWithContext(ctx, "POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(reqBody))
		req.Header.Set("x-api-key", c.apiKey)
		req.Header.Set("anthropic-version", "2023-06-01")
		req.Header.Set("content-type", "application/json")

		resp, err := c.client.Do(req)
		if err != nil {
			lastErr = err
			time.Sleep(time.Duration(attempt*2) * time.Second)
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode == 429 {
			lastErr = fmt.Errorf("rate limited (429)")
			time.Sleep(time.Duration(attempt*2) * time.Second)
			continue
		}

		if resp.StatusCode != 200 {
			var errResp map[string]any
			json.NewDecoder(resp.Body).Decode(&errResp)
			return "", fmt.Errorf("anthropic API error: %d, %v", resp.StatusCode, errResp)
		}

		var result struct {
			Content []struct {
				Text string `json:"text"`
			} `json:"content"`
		}

		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return "", fmt.Errorf("failed to decode response: %w", err)
		}

		if len(result.Content) > 0 {
			return result.Content[0].Text, nil
		}
		return "", fmt.Errorf("empty response from Claude")
	}

	return "", fmt.Errorf("failed after 3 retries: %w", lastErr)
}
