import os
import time
import json
import random
import uuid

# Configuration
# Default to public Railway Redis URL or local fallback
REDIS_URL = os.getenv("REDIS_URL", "redis://default:EYYYwImpcEWRdSKBLXWTZEkMHyCsMaXS@switchyard.proxy.rlwy.net:44176")
AGENT_ID = os.getenv("AGENT_ID", "arbitrage-scout-01")

try:
    import redis
    rdb = redis.Redis.from_url(REDIS_URL)
    print(f"Connected to Redis at {REDIS_URL.split('@')[-1]}")
except ImportError:
    print("Error: 'redis' package is not installed. Run: pip install redis")
    exit(1)

print(f"Starting Price Arbitrage Scout Agent ({AGENT_ID}). Polling feed...")

cycle = 1
while True:
    trace_id = f"t-arb-{uuid.uuid4().hex[:12]}"
    
    # Every 5th cycle, simulate a pricing anomaly / hallucination event
    if cycle % 5 == 0:
        event = "hallucination"
        price = 0.01  # Simulated flash crash / invalid price report
        print(f"\n[CYCLE {cycle}] ⚠️ SIMULATING PRICING ANOMALY: Price crashed to ${price}!")
    else:
        event = "price_update"
        price = round(1.00 + random.uniform(0.00, 0.05), 4)  # Normal price ($1.00 to $1.05)
        print(f"[CYCLE {cycle}] Reporting normal price: ${price}")

    payload = {
        "event": event,
        "metadata": {
            "timestamp": int(time.time() * 1000),
            "telemetry": {
                "trace_id": trace_id,
                "agent_id": AGENT_ID
            }
        },
        "data": {
            "token": "LORE/USDC",
            "price": price
        }
    }

    # Add to the Redis stream
    try:
        rdb.xadd("lore:stream:raw", {"payload": json.dumps(payload)})
        print(f"  -> Published '{event}' (Trace: {trace_id})")
    except Exception as e:
        print(f"  -> Failed to publish: {e}")

    cycle += 1
    time.sleep(5)  # Poll interval
