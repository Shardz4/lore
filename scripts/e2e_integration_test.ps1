# E2E Integration Test Script for Lore Agent Slashing & UI Locking
$ErrorActionPreference = "Stop"

Write-Host "========================================"
Write-Host "Starting Lore E2E Integration Test..."
Write-Host "========================================"

# Generate a unique agent ID for this test run
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$agentId = "agent-e2e-$timestamp"
$traceId = "trace-e2e-$timestamp"

Write-Host "Test Agent ID: $agentId"
Write-Host "Test Trace ID: $traceId"

# 1. Verify that the agent initially has 100% reputation
Write-Host "Checking initial reputation for $agentId..."
$headers = @{
    "Authorization" = "Bearer lore_api_bearer_token_secret_2026"
}
$initialRep = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/reputation/$agentId" -Headers $headers -Method Get
Write-Host "Initial reputation: $($initialRep.score)% (Banned: $($initialRep.banned))"

if ($initialRep.score -ne 100) {
    Write-Error "Error: Initial reputation score should be 100%"
}

# 2. Publish a 'hallucination' event payload to Redis stream 'lore:stream:raw'
Write-Host "Publishing 'hallucination' event to Redis stream 'lore:stream:raw'..."
$cwd = "c:\Users\CREWMOBILE\Desktop\lore\agents\scout-agent"
# We run the go helper tool from the agents/scout-agent directory
Push-Location $cwd
try {
    $publishResult = go run cmd/publish-event/main.go hallucination $agentId $traceId
    Write-Host $publishResult
} finally {
    Pop-Location
}

# 3. Wait for the analyst-agent to process the stream and update Redis
Write-Host "Waiting 3 seconds for analyst-agent processing..."
Start-Sleep -Seconds 3

# 4. Check the agent reputation after slashing
Write-Host "Checking reputation for $agentId after event..."
$finalRep = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/reputation/$agentId" -Headers $headers -Method Get
Write-Host "Final reputation: $($finalRep.score)% (Banned: $($finalRep.banned))"

# 5. Assert reputation is slashed (< 60%)
if ($finalRep.score -ge 60) {
    Write-Error "Test Failed: Reputation score ($($finalRep.score)%) is not below 60% after hallucination."
}

if ($finalRep.banned -ne $true) {
    Write-Error "Test Failed: Agent is not marked as Banned."
}

Write-Host "========================================"
Write-Host "SUCCESS: E2E Slashing Pipeline Verified!"
Write-Host "========================================"
