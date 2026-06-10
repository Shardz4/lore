package consumer

import (
	"context"
	"encoding/json"
	"log"

	"github.com/redis/go-redis/v9"
	"lore/narrative-agent/llm"
	"lore/narrative-agent/models"
	"lore/narrative-agent/server"
)

type Reader struct {
	rdb       *redis.Client
	llmClient *llm.AnthropicClient
	apiServer *server.APIServer
}

func NewReader(rdb *redis.Client, llmClient *llm.AnthropicClient, apiServer *server.APIServer) *Reader {
	return &Reader{
		rdb:       rdb,
		llmClient: llmClient,
		apiServer: apiServer,
	}
}

func (r *Reader) Start(ctx context.Context) {
	stream := "lore:stream:insights"
	group := "narrative_processors"
	consumer := "narrative_1"

	r.rdb.XGroupCreateMkStream(ctx, stream, group, "0")

	for {
		select {
		case <-ctx.Done():
			return
		default:
			res, err := r.rdb.XReadGroup(ctx, &redis.XReadGroupArgs{
				Group:    group,
				Consumer: consumer,
				Streams:  []string{stream, ">"},
				Count:    10,
				Block:    5000,
			}).Result()

			if err != nil {
				if err != redis.Nil {
					log.Printf("XReadGroup error: %v", err)
				}
				continue
			}

			for _, streamMsg := range res {
				for _, msg := range streamMsg.Messages {
					var payloadStr string
					
					// Depending on redis payload serialization
					if p, ok := msg.Values["payload"].(string); ok {
						payloadStr = p
					} else if i, ok2 := msg.Values["insight"].(string); ok2 {
						payloadStr = i
					}

					var insight models.InsightBundle
					if err := json.Unmarshal([]byte(payloadStr), &insight); err != nil {
						log.Printf("Failed to unmarshal insight %s: %v", msg.ID, err)
						continue
					}

					narrative, isMock, err := r.llmClient.GenerateSummary(ctx, insight)
					if err != nil {
						log.Printf("LLM Generation failed for msg %s: %v. Message will NOT be ACKed.", msg.ID, err)
						continue // DO NOT ACK - DLQ Sweeper will pick this up
					}

					r.apiServer.AddNarrative(models.NarrativeResponse{
						Insight:   insight,
						Narrative: narrative,
						IsMock:    isMock,
					})

					r.rdb.XAck(ctx, stream, group, msg.ID)
					log.Printf("Successfully processed and ACKed insight %s", msg.ID)
				}
			}
		}
	}
}
