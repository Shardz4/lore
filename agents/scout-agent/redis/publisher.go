package redis

import (
	"context"
	"encoding/json"
	"os"

	"github.com/redis/go-redis/v9"
	"lore/scout-agent/models"
)

type Publisher struct {
	client *redis.Client
	stream string
}

func NewPublisher(addr, stream string) *Publisher {
	password := os.Getenv("REDIS_PASSWORD")
	if password == "" {
		password = "lore_default_secure_pass"
	}
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
	})
	return &Publisher{
		client: rdb,
		stream: stream,
	}
}

func (p *Publisher) Publish(ctx context.Context, payload models.Payload) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	_, err = p.client.XAdd(ctx, &redis.XAddArgs{
		Stream: p.stream,
		Values: map[string]interface{}{
			"payload": string(data),
		},
	}).Result()

	return err
}

func (p *Publisher) Close() error {
	return p.client.Close()
}
