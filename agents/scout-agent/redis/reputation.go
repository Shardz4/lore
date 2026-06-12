package redis

import (
	"math"
)

// Using an in-memory map for the prototype. In production, this maps to a Redis Hash.
var mockReputationDB = make(map[string]*AgentReputation)

type AgentReputation struct {
	SuccessCount int `json:"success_count"`
	FailCount    int `json:"fail_count"`
}

// GetReputationScore mathematically calculates the agent's trust score.
// Equation: Base = Success / (Success + Fail). 
// Exponential Penalty: Every failure instantly drops the score by 20%.
func GetReputationScore(agentID string) float64 {
	record, exists := mockReputationDB[agentID]
	if !exists {
		return 100.0 // Default starting trust
	}

	total := record.SuccessCount + record.FailCount
	if total == 0 {
		return 100.0
	}

	baseRatio := float64(record.SuccessCount) / float64(total)
	
	// Exponential penalty: 0.8 ^ failCount (e.g. 1 fail = 80%, 2 fails = 64%)
	penaltyFactor := math.Pow(0.8, float64(record.FailCount))

	score := baseRatio * penaltyFactor * 100.0
	
	// Floor at 0
	if score < 0 {
		return 0
	}
	return score
}

// RecordSuccess bumps the success counter
func RecordSuccess(agentID string) {
	record, exists := mockReputationDB[agentID]
	if !exists {
		record = &AgentReputation{}
		mockReputationDB[agentID] = record
	}
	record.SuccessCount++
}

// RecordFailure applies a slash
func RecordFailure(agentID string) {
	record, exists := mockReputationDB[agentID]
	if !exists {
		record = &AgentReputation{}
		mockReputationDB[agentID] = record
	}
	record.FailCount++
}
