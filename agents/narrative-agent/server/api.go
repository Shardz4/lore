package server

import (
	"encoding/json"
	"net/http"
	"sync"

	"lore/narrative-agent/models"
)

type APIEnvelope struct {
	Insights       []models.NarrativeResponse `json:"insights"`
	TotalProcessed int64                      `json:"total_processed"`
	Truncated      bool                       `json:"truncated"`
	Limit          int                        `json:"limit"`
}

type APIServer struct {
	port           string
	cache          []models.NarrativeResponse
	totalProcessed int64
	mu             sync.RWMutex
}

func NewAPIServer(port string) *APIServer {
	return &APIServer{
		port:  port,
		cache: make([]models.NarrativeResponse, 0, 50),
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

func (s *APIServer) Start() error {
	// Legacy endpoint: returns raw array to prevent breaking existing consumers
	http.HandleFunc("/api/v1/insights", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
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
		w.Header().Set("Access-Control-Allow-Origin", "*")
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

	return http.ListenAndServe(":"+s.port, nil)
}
