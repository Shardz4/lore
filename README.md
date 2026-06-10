# Lore Monorepo

Welcome to the Lore monorepo! This repository is configured with essential infrastructure services to support data processing and distributed tracing.

## Infrastructure Overview

The current infrastructure stack includes:
- **Redis (Streams)**: Acts as the primary message broker. It is configured with persistence to ensure reliability. We use a Redis Stream named `lore:stream:raw` and a Consumer Group named `scout_processors` to manage events.
- **Jaeger**: Provides OpenTelemetry distributed tracing visualization, allowing us to monitor and troubleshoot transactions across the microservices architecture.

## Getting Started

A unified `Makefile` is provided at the root to simplify orchestrating the environment.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- `make` (If on Windows, you can use Git Bash, MSYS2, WSL, or run the docker commands directly)

### Orchestration Commands

- **Start Infrastructure**: Brings up the Redis and Jaeger instances in detached mode.
  ```bash
  make up
  ```
- **Initialize Redis**: Sets up the required Redis Stream (`lore:stream:raw`) and Consumer Group (`scout_processors`). Make sure the containers are running before executing this.
  ```bash
  make init
  ```
- **View Logs**: Follows the logs for the running services.
  ```bash
  make logs
  ```
- **Stop Infrastructure**: Tears down the network fabric gracefully.
  ```bash
  make down
  ```
- **Clean Up**: Tears down the containers and removes persistent volumes (WARNING: destroys Redis data).
  ```bash
  make clean
  ```

## Services & Ports

| Service | Port | Description |
|---|---|---|
| **Redis** | `6379` | Standard Redis port |
| **Jaeger UI** | `16686` | Web interface for viewing traces |
| **Jaeger OTLP** | `4317` (gRPC), `4318` (HTTP) | OpenTelemetry receivers |
