package dlq

import (
	"context"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

type Sweeper struct {
	rdb    *redis.Client
	stream string
	group  string
}

func NewSweeper(rdb *redis.Client, stream, group string) *Sweeper {
	return &Sweeper{
		rdb:    rdb,
		stream: stream,
		group:  group,
	}
}

func (s *Sweeper) Start(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.sweep(ctx)
		}
	}
}

func (s *Sweeper) sweep(ctx context.Context) {
	pending, err := s.rdb.XPendingExt(ctx, &redis.XPendingExtArgs{
		Stream: s.stream,
		Group:  s.group,
		Start:  "-",
		End:    "+",
		Count:  100,
	}).Result()

	if err != nil {
		return
	}

	for _, p := range pending {
		if p.Idle > 60*time.Second {
			log.Printf("[DLQ] Sweeping stuck message ID %s to lore:stream:dlq", p.ID)

			msgs, err := s.rdb.XClaim(ctx, &redis.XClaimArgs{
				Stream:   s.stream,
				Group:    s.group,
				Consumer: "dlq_sweeper",
				MinIdle:  60 * time.Second,
				Messages: []string{p.ID},
			}).Result()

			if err != nil || len(msgs) == 0 {
				continue
			}

			s.rdb.XAdd(ctx, &redis.XAddArgs{
				Stream: "lore:stream:dlq",
				Values: msgs[0].Values,
			})

			s.rdb.XAck(ctx, s.stream, s.group, p.ID)
		}
	}
}
