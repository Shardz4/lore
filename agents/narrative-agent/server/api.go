package server

import (
	"context"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
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
	limiter        *IPRateLimiter
}

type AgentReputationRecord struct {
	SuccessCount int `json:"success_count"`
	FailCount    int `json:"fail_count"`
}

var (
	googlePublicKeys       map[string]string
	googlePublicKeysExpiry time.Time
	publicKeysMu           sync.RWMutex
)

func fetchGooglePublicKeys() (map[string]string, error) {
	publicKeysMu.RLock()
	if time.Now().Before(googlePublicKeysExpiry) && googlePublicKeys != nil {
		defer publicKeysMu.RUnlock()
		return googlePublicKeys, nil
	}
	publicKeysMu.RUnlock()

	publicKeysMu.Lock()
	defer publicKeysMu.Unlock()

	// Double check
	if time.Now().Before(googlePublicKeysExpiry) && googlePublicKeys != nil {
		return googlePublicKeys, nil
	}

	resp, err := http.Get("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var newKeys map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&newKeys); err != nil {
		return nil, err
	}

	googlePublicKeys = newKeys
	googlePublicKeysExpiry = time.Now().Add(1 * time.Hour)
	return googlePublicKeys, nil
}

func verifyFirebaseToken(tokenString string, projectID string) (*jwt.Token, error) {
	keys, err := fetchGooglePublicKeys()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch google public keys: %w", err)
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		kid, ok := token.Header["kid"].(string)
		if !ok {
			return nil, fmt.Errorf("kid header not found")
		}

		certPEM, ok := keys[kid]
		if !ok {
			return nil, fmt.Errorf("key not found for kid: %s", kid)
		}

		block, _ := pem.Decode([]byte(certPEM))
		if block == nil {
			return nil, fmt.Errorf("failed to parse PEM block containing certificate")
		}

		cert, err := x509.ParseCertificate(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("failed to parse certificate: %w", err)
		}

		rsaPubKey, ok := cert.PublicKey.(*rsa.PublicKey)
		if !ok {
			return nil, fmt.Errorf("public key is not RSA")
		}

		return rsaPubKey, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		// Verify iss
		iss, _ := claims["iss"].(string)
		expectedIss := "https://securetoken.google.com/" + projectID
		if iss != expectedIss {
			return nil, fmt.Errorf("invalid issuer: %s", iss)
		}

		// Verify aud
		aud, _ := claims["aud"].(string)
		if aud != projectID {
			return nil, fmt.Errorf("invalid audience: %s", aud)
		}

		// Verify exp
		expVal, _ := claims["exp"].(float64)
		if time.Now().Unix() > int64(expVal) {
			return nil, fmt.Errorf("token is expired")
		}

		return token, nil
	}

	return nil, fmt.Errorf("invalid token claims")
}

type rateLimiterRecord struct {
	tokens     float64
	lastUpdate time.Time
}

type IPRateLimiter struct {
	ips map[string]*rateLimiterRecord
	mu  sync.Mutex
	r   float64 // rate: tokens per second
	b   int     // burst size: max tokens
}

func NewIPRateLimiter(r float64, b int) *IPRateLimiter {
	return &IPRateLimiter{
		ips: make(map[string]*rateLimiterRecord),
		r:   r,
		b:   b,
	}
}

func (lim *IPRateLimiter) Allow(ip string) bool {
	lim.mu.Lock()
	defer lim.mu.Unlock()

	now := time.Now()
	rec, exists := lim.ips[ip]
	if !exists {
		lim.ips[ip] = &rateLimiterRecord{
			tokens:     float64(lim.b - 1),
			lastUpdate: now,
		}
		return true
	}

	elapsed := now.Sub(rec.lastUpdate).Seconds()
	rec.tokens += elapsed * lim.r
	if rec.tokens > float64(lim.b) {
		rec.tokens = float64(lim.b)
	}
	rec.lastUpdate = now

	if rec.tokens >= 1.0 {
		rec.tokens -= 1.0
		return true
	}
	return false
}

func getIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	parts := strings.Split(r.RemoteAddr, ":")
	return parts[0]
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
		limiter:       NewIPRateLimiter(5.0, 10), // 5 requests per second, burst limit of 10
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

func (s *APIServer) rateLimitMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip := getIP(r)
		if !s.limiter.Allow(ip) {
			http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
			return
		}
		next(w, r)
	}
}

// authMiddleware checks the request for a valid Bearer token (static or Firebase JWT).
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
		if !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Unauthorized: Invalid or missing API Bearer token", http.StatusUnauthorized)
			return
		}
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		projectID := os.Getenv("FIREBASE_PROJECT_ID")
		if projectID == "" {
			// Bypassed: Fallback to static token verification
			if tokenStr != s.apiToken {
				http.Error(w, "Unauthorized: Invalid static token", http.StatusUnauthorized)
				return
			}
		} else {
			// Validate Firebase ID token
			_, err := verifyFirebaseToken(tokenStr, projectID)
			if err != nil {
				// Allow static token fallback even if projectID is configured, only if we are in development mode
				if (os.Getenv("ENV") == "development" || os.Getenv("NODE_ENV") == "development") && tokenStr == s.apiToken {
					// Approved dev override
				} else {
					log.Printf("[Lore] Firebase token validation error: %v", err)
					http.Error(w, "Unauthorized: Invalid Firebase ID token", http.StatusUnauthorized)
					return
				}
			}
		}

		next(w, r)
	}
}

func (s *APIServer) Start() error {
	mux := http.NewServeMux()

	// Legacy endpoint: returns raw array to prevent breaking existing consumers
	mux.HandleFunc("/api/v1/insights", s.rateLimitMiddleware(s.authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		s.mu.RLock()
		defer s.mu.RUnlock()

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(s.cache)
	})))

	// New endpoint: returns the wrapped API envelope
	mux.HandleFunc("/api/v2/insights", s.rateLimitMiddleware(s.authMiddleware(func(w http.ResponseWriter, r *http.Request) {
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
	})))

	// C2 FIX: Server-side reputation endpoint
	mux.HandleFunc("/api/v1/reputation/", s.rateLimitMiddleware(s.authMiddleware(func(w http.ResponseWriter, r *http.Request) {
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
	})))

	// Leaderboard endpoint (L1)
	mux.HandleFunc("/api/v1/leaderboard", s.rateLimitMiddleware(s.authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		ctx := context.Background()
		keys, err := s.rdb.Keys(ctx, "lore:reputation:*").Result()
		if err != nil {
			log.Printf("[Lore] Error querying Redis keys for leaderboard: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		type LeaderboardEntry struct {
			ID           string  `json:"id"`
			Name         string  `json:"name"`
			SuccessCount int     `json:"successCount"`
			FailCount    int     `json:"failCount"`
			Score        float64 `json:"score"`
			Status       string  `json:"status"`
		}

		entries := make([]LeaderboardEntry, 0)
		for _, key := range keys {
			agentID := strings.TrimPrefix(key, "lore:reputation:")
			if agentID == "" {
				continue
			}

			vals, err := s.rdb.HMGet(ctx, key, "success_count", "fail_count").Result()
			if err != nil {
				continue
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

			score := s.GetReputationScore(agentID)
			
			status := "TRUSTED"
			if score < 60.0 {
				status = "SLASHED"
			} else if score < 80.0 {
				status = "WARNING"
			}

			name := agentID
			if strings.HasPrefix(agentID, "0x") && len(agentID) > 10 {
				name = agentID[:6] + "..." + agentID[len(agentID)-4:]
			}

			entries = append(entries, LeaderboardEntry{
				ID:           agentID,
				Name:         name,
				SuccessCount: successCount,
				FailCount:    failCount,
				Score:        score,
				Status:       status,
			})
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(entries)
	})))

	server := &http.Server{
		Addr:           ":" + s.port,
		Handler:        mux,
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1 MB
	}

	certFile := os.Getenv("TLS_CERT_FILE")
	keyFile := os.Getenv("TLS_KEY_FILE")
	if certFile != "" && keyFile != "" {
		log.Printf("[Lore] Starting HTTPS server on port %s...", s.port)
		return server.ListenAndServeTLS(certFile, keyFile)
	}

	log.Printf("[Lore] Starting HTTP server on port %s (TLS disabled). Ensure a reverse proxy terminates TLS in production.", s.port)
	return server.ListenAndServe()
}

