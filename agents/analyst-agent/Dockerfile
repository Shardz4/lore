# Multi-stage Dockerfile for Rust Analyst Agent in Monorepo
FROM rust:latest-slim AS builder

WORKDIR /usr/src/app

# Copy the entire monorepo so that path dependencies (e.g. zk-circuit/methods) resolve correctly
COPY . .

# Compile the analyst-agent binary
RUN cargo build --release --manifest-path agents/analyst-agent/Cargo.toml

# Final runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Copy the compiled binary
COPY --from=builder /usr/src/app/agents/analyst-agent/target/release/analyst-agent /app/analyst-agent

# Run the binary
CMD ["/app/analyst-agent"]
