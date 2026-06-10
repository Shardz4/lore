# Lore Monorepo

Welcome to the Lore monorepo! This repository contains the distributed edge architecture for autonomous behavioral data processing, featuring MCP (Model Context Protocol) integrations.

## Architecture Overview

The Lore system consists of:

- **Scout Agent (Go)**: A high-performance ingestion service operating at the edge. It acts as a native MCP Client, connecting to the **Novus MCP Server** via Streamable HTTP (OAuth 2.1) to pull real-time behavioral signals (e.g., feature drop-offs, rage clicks). It stamps every payload with an OpenTelemetry `trace_id` and securely streams it to Redis.
- **Analyst Agent (Rust)**: An asynchronous downstream processor. It consumes the raw telemetry via a Redis Consumer Group (`scout_processors`), leveraging zero-copy JSON deserialization. It utilizes sliding-window analytics to generate `InsightBundle` structs and pushes them to `lore:stream:insights`, maintaining the distributed trace context.
- **Redis (Streams)**: The distributed message broker linking the agents via `lore:stream:raw` and `lore:stream:insights`.
- **Jaeger**: Provides OpenTelemetry distributed tracing visualization, allowing us to trace the lifecycle of a behavioral event from the edge (Scout) to the processor (Analyst).

## Getting Started

A unified `Makefile` is provided at the root to simplify orchestrating the environment.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- `make` (If on Windows, you can use Git Bash, MSYS2, WSL, or run the docker commands directly)
- Go 1.25+ (for `scout-agent`)
- Rust 1.70+ (for `analyst-agent`)

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
- **Stop / Clean Up**: Tears down the network fabric.
  ```bash
  make down
  make clean
  ```

## Agents Setup

### Scout Agent
Requires a `.env` file in `agents/scout-agent` with:
- `NOVUS_MCP_ENDPOINT=https://novus-api.pendo.io/mcp`

### Analyst Agent
Requires a `.env` file in `agents/analyst-agent` with:
- `REDIS_URL=redis://localhost:6379`
- `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317`

## Services & Ports

| Service | Port | Description |
|---|---|---|
| **Redis** | `6379` | Standard Redis port |
| **Jaeger UI** | `16686` | Web interface for viewing traces |
| **Jaeger OTLP** | `4317` (gRPC), `4318` (HTTP) | OpenTelemetry receivers |
