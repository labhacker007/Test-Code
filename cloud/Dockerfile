FROM golang:1.23-alpine AS builder

WORKDIR /build

# Copy go mod files
COPY cloud/go.mod cloud/go.sum ./
RUN go mod download

# Copy source
COPY cloud/ ./

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o cloud-api ./cmd/api

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

COPY --from=builder /build/cloud-api .

EXPOSE 8080

ENTRYPOINT ["./cloud-api"]
