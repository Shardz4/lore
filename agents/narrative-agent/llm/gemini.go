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

type GeminiClient struct {
	apiKey string
	client *http.Client
}

func NewGeminiClient(apiKey string) *GeminiClient {
	return &GeminiClient{
		apiKey: apiKey,
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *GeminiClient) GenerateSummary(ctx context.Context, insight models.InsightBundle) (string, bool, error) {
	if c.apiKey == "" {
		return "", false, fmt.Errorf("gemini api key is empty; configure GEMINI_API_KEY in agents/narrative-agent/.env")
	}

	prompt := fmt.Sprintf("Act as an expert Product Manager. We detected a %s anomaly. Description: %s. Event count: %d. Provide a concise, actionable summary of what to investigate.", insight.InsightType, insight.Description, insight.EventCount)

	// Gemini generateContent structure
	payload := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{"text": prompt},
				},
			},
		},
	}

	reqBody, _ := json.Marshal(payload)

	var lastErr error
	apiURL := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=%s", c.apiKey)

	for attempt := 1; attempt <= 3; attempt++ {
		req, err := http.NewRequestWithContext(ctx, "POST", apiURL, bytes.NewBuffer(reqBody))
		if err != nil {
			return "", false, err
		}
		req.Header.Set("content-type", "application/json")

		resp, err := c.client.Do(req)
		if err != nil {
			lastErr = err
			time.Sleep(time.Duration(attempt*2) * time.Second)
			continue
		}

		if resp.StatusCode == 429 {
			resp.Body.Close()
			lastErr = fmt.Errorf("rate limited (429)")
			time.Sleep(time.Duration(attempt*2) * time.Second)
			continue
		}

		if resp.StatusCode != 200 {
			var errResp map[string]any
			json.NewDecoder(resp.Body).Decode(&errResp)
			resp.Body.Close()
			return "", false, fmt.Errorf("gemini API error: %d, %v", resp.StatusCode, errResp)
		}

		type GeminiResponse struct {
			Candidates []struct {
				Content struct {
					Parts []struct {
						Text string `json:"text"`
					} `json:"parts"`
				} `json:"content"`
			} `json:"candidates"`
		}

		var result GeminiResponse
		err = json.NewDecoder(resp.Body).Decode(&result)
		resp.Body.Close()
		if err != nil {
			return "", false, fmt.Errorf("failed to decode response: %w", err)
		}

		if len(result.Candidates) > 0 && len(result.Candidates[0].Content.Parts) > 0 {
			return result.Candidates[0].Content.Parts[0].Text, false, nil
		}
		return "", false, fmt.Errorf("empty response from Gemini")
	}

	return "", false, fmt.Errorf("failed after 3 retries: %w", lastErr)
}
