package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"strings"
	"sync"

	"github.com/redis/go-redis/v9"
	"lore/narrative-agent/models"
)

type APIEnvelope struct {
	Insights       []models.NarrativeResponse `json:"insights"`
	TotalProcessed int64                      `json:"total_processed"`
	Truncated      bool                       `json:"truncated"`
	Limit          int                        `json:"limit"`
}

// ReputationResponse is returned by the /api/v1/reputation/{agentID} endpoint
type ReputationResponse struct {
	AgentID string  `json:"agent_id"`
	Score   float64 `json:"score"`
	Banned  bool    `json:"banned"`
}

type APIServer struct {
	port           string
	allowedOrigin  string // H2 FIX: Replaces CORS wildcard "*"
	apiToken       string // M3 API Bearer Token
	cache          []models.NarrativeResponse
	totalProcessed int64
	mu             sync.RWMutex
	rdb            *redis.Client // M2 persistent Redis client
}

type AgentReputationRecord struct {
	SuccessCount int `json:"success_count"`
	FailCount    int `json:"fail_count"`
}

func NewAPIServer(port string, rdb *redis.Client) *APIServer {
	// H2 FIX: Read allowed CORS origin from env. Defaults to localhost for local dev.
	origin := os.Getenv("ALLOWED_ORIGIN")
	if origin == "" {
		origin = "http://localhost:3000"
	}
	token := os.Getenv("API_BEARER_TOKEN")
	if token == "" {
		token = "lore_default_secret_api_token"
	}
	return &APIServer{
		port:          port,
		allowedOrigin: origin,
		apiToken:      token,
		cache:         make([]models.NarrativeResponse, 0, 50),
		rdb:           rdb,
	}
}

func (s *APIServer) AddNarrative(n models.NarrativeResponse) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.totalProcessed++
	if len(s.cache) >= 50 {
		s.cache = s.cache[1:]
	}
	s.cache = append(s.cache, n)
}

// GetReputationScore computes the mathematical trust score server-side.
// Equation: (success / total) * 0.8^failCount * 100
func (s *APIServer) GetReputationScore(agentID string) float64 {
	ctx := context.Background()
	vals, err := s.rdb.HMGet(ctx, fmt.Sprintf("lore:reputation:%s", agentID), "success_count", "fail_count").Result()
	if err != nil {
		log.Printf("[Lore] Error querying Redis reputation for agent %s: %v", agentID, err)
		return 100.0 // Default starting trust
	}

	successCount := 0
	failCount := 0

	if len(vals) == 2 {
		if sCountStr, ok := vals[0].(string); ok {
			fmt.Sscanf(sCountStr, "%d", &successCount)
		}
		if fCountStr, ok := vals[1].(string); ok {
			fmt.Sscanf(fCountStr, "%d", &failCount)
		}
	}

	total := successCount + failCount
	if total == 0 {
		return 100.0 // Default starting trust
	}

	baseRatio := float64(successCount) / float64(total)
	penaltyFactor := math.Pow(0.8, float64(failCount))
	score := baseRatio * penaltyFactor * 100.0
	if score < 0 {
		return 0
	}
	return score
}

// authMiddleware checks the request for a valid Bearer token in the Authorization header.
func (s *APIServer) authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// H2 & M3 FIX: Handle CORS preflight explicitly and configure authorized headers
		w.Header().Set("Access-Control-Allow-Origin", s.allowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		authHeader := r.Header.Get("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") || strings.TrimPrefix(authHeader, "Bearer ") != s.apiToken {
			http.Error(w, "Unauthorized: Invalid or missing API Bearer token", http.StatusUnauthorized)
			return
		}

		next(w, r)
	}
}

func (s *APIServer) Start() error {
	// Legacy endpoint: returns raw array to prevent breaking existing consumers
	http.HandleFunc("/api/v1/insights", s.authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		s.mu.RLock()
		defer s.mu.RUnlock()

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(s.cache)
	}))

	// New endpoint: returns the wrapped API envelope
	http.HandleFunc("/api/v2/insights", s.authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		s.mu.RLock()
		defer s.mu.RUnlock()

		envelope := APIEnvelope{
			Insights:       s.cache,
			TotalProcessed: s.totalProcessed,
			Truncated:      s.totalProcessed > 50,
			Limit:          50,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(envelope)
	}))

	// C2 FIX: Server-side reputation endpoint
	// The dashboard fetches from here instead of reading localStorage.
	// This is the authoritative source of truth for agent reputation.
	http.HandleFunc("/api/v1/reputation/", s.authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		// Extract agentID from URL path: /api/v1/reputation/{agentID}
		parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/v1/reputation/"), "/")
		agentID := parts[0]
		if agentID == "" {
			http.Error(w, "agent ID required", http.StatusBadRequest)
			return
		}

		score := s.GetReputationScore(agentID)
		resp := ReputationResponse{
			AgentID: agentID,
			Score:   score,
			Banned:  score < 60.0,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))

	return http.ListenAndServe(":"+s.port, nil)
}
