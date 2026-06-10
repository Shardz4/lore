package server

import (
	"encoding/json"
	"net/http"
	"sync"

	"lore/narrative-agent/models"
)

type APIServer struct {
	port   string
	cache  []models.NarrativeResponse
	mu     sync.RWMutex
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

	if len(s.cache) >= 50 {
		s.cache = s.cache[1:]
	}
	s.cache = append(s.cache, n)
}

func (s *APIServer) Start() error {
	http.HandleFunc("/api/v1/insights", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		s.mu.RLock()
		defer s.mu.RUnlock()

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(s.cache)
	})

	return http.ListenAndServe(":"+s.port, nil)
}
