# Lore Monorepo

Welcome to the Lore monorepo! This repository contains the distributed edge architecture for autonomous behavioral data processing, featuring MCP (Model Context Protocol) integrations.

## Architecture Overview

The Lore system consists of three tiered agentic layers:

- **Scout Agent (Go)**: A high-performance ingestion service operating at the edge. It acts as a native MCP Client, connecting to the **Novus MCP Server** via Streamable HTTP (OAuth 2.1) to pull real-time behavioral signals (e.g., feature drop-offs, rage clicks). It stamps every payload with an OpenTelemetry `trace_id` and securely streams it to Redis (`lore:stream:raw`).
- **Analyst Agent (Rust)**: An asynchronous downstream processor. It consumes the raw telemetry via a Redis Consumer Group (`scout_processors`), leveraging zero-copy JSON deserialization. It utilizes sliding-window analytics to generate `InsightBundle` structs and pushes them to `lore:stream:insights`, maintaining the distributed trace context.
- **Narrative Agent (Go)**: The synthesis layer. It consumes `InsightBundle`s from the analyst stream and interfaces with **Anthropic's Claude 3.5 Sonnet** to generate actionable Product Manager summaries. It features a robust Dead-Letter Queue (DLQ) Sweeper that automatically routes failing LLM requests to `lore:stream:dlq`, and serves finalized insights via a lightning-fast REST API.
- **Redis (Streams)**: The distributed message broker linking the agents.
- **Jaeger**: Provides OpenTelemetry distributed tracing visualization, allowing us to trace the lifecycle of a behavioral event entirely from the edge (Scout) to the processor (Analyst).

## Getting Started

A unified `Makefile` is provided at the root to simplify orchestrating the environment.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- `make` (If on Windows, you can use Git Bash, MSYS2, WSL, or run the docker commands directly)
- Go 1.25+ (for `scout-agent` and `narrative-agent`)
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

### 1. Scout Agent
Requires a `.env` file in `agents/scout-agent` with:
- `NOVUS_MCP_ENDPOINT=https://novus-api.pendo.io/mcp`

### 2. Analyst Agent
Requires a `.env` file in `agents/analyst-agent` with:
- `REDIS_URL=redis://localhost:6379`
- `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317`

### 3. Narrative Agent
Requires a `.env` file in `agents/narrative-agent` with:
- `REDIS_URL=redis://localhost:6379`
- `ANTHROPIC_API_KEY=your_claude_api_key`
- `SERVER_PORT=8080`

## Services & Ports

| Service | Port | Description |
|---|---|---|
| **Redis** | `6379` | Standard Redis port |
| **Jaeger UI** | `16686` | Web interface for viewing traces |
| **Jaeger OTLP** | `4317` (gRPC), `4318` (HTTP) | OpenTelemetry receivers |
| **Narrative API** | `8080` | REST API (`GET /api/v1/insights`) |
