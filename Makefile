.PHONY: up down init logs clean

# Brings up the network fabric
up:
	docker-compose up -d

# Tears down the network fabric
down:
	docker-compose down

# Initializes required infrastructure (like Redis streams)
init:
	bash infrastructure/init-redis.sh

# Views logs for the services
logs:
	docker-compose logs -f

# Tears down and removes volumes (WARNING: destroys persistent data)
clean:
	docker-compose down -v
