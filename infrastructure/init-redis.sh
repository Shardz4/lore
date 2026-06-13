#!/bin/bash
# Initializes the Redis stream and consumer group for the Lore monorepo

echo "Initializing Redis Stream 'lore:stream:raw' and Consumer Group 'scout_processors'..."

# MKSTREAM creates the stream if it does not already exist
PASSWORD=${REDIS_PASSWORD:-"arnav_$1234"}
# Escape double-dollar sign if it was loaded literally from a .env file/env var
PASSWORD="${PASSWORD//\$\$/\$}"
docker exec lore_redis redis-cli -a "$PASSWORD" XGROUP CREATE lore:stream:raw scout_processors \$ MKSTREAM

# Check if the command was successful or if the group already exists
if [ $? -eq 0 ]; then
    echo "Successfully initialized stream and consumer group."
else
    echo "Consumer group might already exist or Redis is not reachable."
fi
