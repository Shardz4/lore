# Initializes the Redis stream and consumer group for the Lore monorepo
Write-Host "Initializing Redis Stream 'lore:stream:raw' and Consumer Group 'scout_processors'..." -ForegroundColor Cyan

# MKSTREAM creates the stream if it does not already exist
$password = $env:REDIS_PASSWORD
if (-not $password) {
    $password = "arnav_`$1234"
}
$password = $password -replace '\$\$', '$'
docker exec lore_redis redis-cli -a $password XGROUP CREATE lore:stream:raw scout_processors `$ MKSTREAM

if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully initialized stream and consumer group." -ForegroundColor Green
} else {
    Write-Host "Consumer group might already exist or Redis is not reachable." -ForegroundColor Yellow
}
