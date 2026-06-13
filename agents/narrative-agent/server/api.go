package server

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"sync"

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
	cache          []models.NarrativeResponse
	totalProcessed int64
	mu             sync.RWMutex
	// Server-side reputation store (C2 FIX: replaces client-side localStorage)
	reputationStore map[string]*AgentReputationRecord
	repMu           sync.RWMutex
}

type AgentReputationRecord struct {
	SuccessCount int `json:"success_count"`
	FailCount    int `json:"fail_count"`
}

func NewAPIServer(port string) *APIServer {
	// H2 FIX: Read allowed CORS origin from env. Defaults to localhost for local dev.
	origin := os.Getenv("ALLOWED_ORIGIN")
	if origin == "" {
		origin = "http://localhost:3000"
	}
	return &APIServer{
		port:            port,
		allowedOrigin:   origin,
		cache:           make([]models.NarrativeResponse, 0, 50),
		reputationStore: make(map[string]*AgentReputationRecord),
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
	s.repMu.RLock()
	defer s.repMu.RUnlock()

	record, exists := s.reputationStore[agentID]
	if !exists {
		return 100.0
	}
	total := record.SuccessCount + record.FailCount
	if total == 0 {
		return 100.0
	}
	baseRatio := float64(record.SuccessCount) / float64(total)
	penaltyFactor := 1.0
	for i := 0; i < record.FailCount; i++ {
		penaltyFactor *= 0.8
	}
	score := baseRatio * penaltyFactor * 100.0
	if score < 0 {
		return 0
	}
	return score
}

func (s *APIServer) Start() error {
	// Legacy endpoint: returns raw array to prevent breaking existing consumers
	http.HandleFunc("/api/v1/insights", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", s.allowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		s.mu.RLock()
		defer s.mu.RUnlock()

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(s.cache)
	})

	// New endpoint: returns the wrapped API envelope
	http.HandleFunc("/api/v2/insights", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", s.allowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

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
	})

	// C2 FIX: Server-side reputation endpoint
	// The dashboard fetches from here instead of reading localStorage.
	// This is the authoritative source of truth for agent reputation.
	http.HandleFunc("/api/v1/reputation/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", s.allowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

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
	})

	return http.ListenAndServe(":"+s.port, nil)
}
