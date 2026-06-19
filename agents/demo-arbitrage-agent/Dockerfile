# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy dependency configs and download
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build
COPY . .
RUN go build -o mcp_server mcp_server.go

# Runtime stage
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/mcp_server .

EXPOSE 8000
CMD ["./mcp_server"]
