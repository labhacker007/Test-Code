# Makefile for Runtime AI Security Platform

.PHONY: all build-agent build-cloud test clean install docker-build docker-up docs help

# Variables
AGENT_BINARY := runtime-ai-agent
CLOUD_BINARY := cloud-api
VERSION := 0.1.0
BUILD_DIR := dist

# Go build flags
LDFLAGS := -ldflags "-X main.version=$(VERSION) -s -w"

all: build-agent build-cloud

help:
	@echo "Runtime AI Security Platform - Build Commands"
	@echo ""
	@echo "Agent:"
	@echo "  make build-agent        Build endpoint agent"
	@echo "  make build-agent-all    Build agent for all platforms"
	@echo "  make install-agent      Install agent locally"
	@echo ""
	@echo "Cloud:"
	@echo "  make build-cloud        Build cloud API server"
	@echo "  make docker-build       Build Docker image"
	@echo "  make docker-up          Start cloud with docker-compose"
	@echo ""
	@echo "Testing:"
	@echo "  make test               Run all tests"
	@echo "  make test-agent         Run agent tests"
	@echo "  make test-cloud         Run cloud tests"
	@echo ""
	@echo "Documentation:"
	@echo "  make docs-generate      Generate architecture diagrams"
	@echo "  make docs-validate      Validate documentation"
	@echo "  make docs-version       Create version snapshot"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean              Remove build artifacts"
	@echo "  make fmt                Format code"

# Agent builds
build-agent:
	@echo "Building agent for current platform..."
	cd agent && go build $(LDFLAGS) -o ../$(BUILD_DIR)/$(AGENT_BINARY) ./cmd/agent
	@echo "Built: $(BUILD_DIR)/$(AGENT_BINARY)"

build-agent-all:
	@echo "Building agent for all platforms..."
	@mkdir -p $(BUILD_DIR)
	cd agent && GOOS=darwin GOARCH=arm64 go build $(LDFLAGS) -o ../$(BUILD_DIR)/$(AGENT_BINARY)-darwin-arm64 ./cmd/agent
	cd agent && GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -o ../$(BUILD_DIR)/$(AGENT_BINARY)-darwin-amd64 ./cmd/agent
	cd agent && GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o ../$(BUILD_DIR)/$(AGENT_BINARY)-linux-amd64 ./cmd/agent
	cd agent && GOOS=linux GOARCH=arm64 go build $(LDFLAGS) -o ../$(BUILD_DIR)/$(AGENT_BINARY)-linux-arm64 ./cmd/agent
	cd agent && GOOS=windows GOARCH=amd64 go build $(LDFLAGS) -o ../$(BUILD_DIR)/$(AGENT_BINARY)-windows-amd64.exe ./cmd/agent
	@echo "Built all platform binaries in $(BUILD_DIR)/"

install-agent: build-agent
	@echo "Installing agent..."
	sudo cp $(BUILD_DIR)/$(AGENT_BINARY) /usr/local/bin/
	mkdir -p ~/.runtime-ai-security
	cp rules/default-policy.json ~/.runtime-ai-security/policy.json
	@echo "Installed to /usr/local/bin/$(AGENT_BINARY)"

# Cloud builds
build-cloud:
	@echo "Building cloud API..."
	cd cloud && go build $(LDFLAGS) -o ../$(BUILD_DIR)/$(CLOUD_BINARY) ./cmd/api
	@echo "Built: $(BUILD_DIR)/$(CLOUD_BINARY)"

# Docker
docker-build:
	@echo "Building Docker image..."
	docker build -t runtime-ai-security/cloud-api:$(VERSION) -f cloud/Dockerfile .
	docker tag runtime-ai-security/cloud-api:$(VERSION) runtime-ai-security/cloud-api:latest

docker-up:
	@echo "Starting services with docker-compose..."
	cd deployment/docker && docker-compose up -d
	@echo "Services started. API: http://localhost:8080, Dashboard: http://localhost:8081"

docker-down:
	cd deployment/docker && docker-compose down

# Testing
test: test-agent test-cloud

test-agent:
	@echo "Running agent tests..."
	cd agent && go test -v ./...

test-cloud:
	@echo "Running cloud tests..."
	cd cloud && go test -v ./...

# Utilities
clean:
	@echo "Cleaning build artifacts..."
	rm -rf $(BUILD_DIR)
	cd agent && go clean
	cd cloud && go clean

fmt:
	@echo "Formatting code..."
	cd agent && go fmt ./...
	cd cloud && go fmt ./...

deps:
	@echo "Downloading dependencies..."
	cd agent && go mod download
	cd cloud && go mod download

# Documentation
docs-generate:
	@echo "Generating architecture diagrams..."
	python3 .cursor/skills/documentation-expert/scripts/generate-diagram.py > docs/ARCHITECTURE-AUTO.md
	@echo "Generated: docs/ARCHITECTURE-AUTO.md"

docs-validate:
	@echo "Validating documentation..."
	bash .cursor/skills/documentation-expert/scripts/validate-docs.sh

docs-version:
	@echo "Creating version $(VERSION) snapshot..."
	mkdir -p docs/versions/v$(VERSION)
	cp ARCHITECTURE.md docs/versions/v$(VERSION)/
	cp docs/API.md docs/versions/v$(VERSION)/ 2>/dev/null || true
	echo "Created: $(shell date)" > docs/versions/v$(VERSION)/VERSION_INFO.md
	@echo "Snapshot saved to docs/versions/v$(VERSION)/"

docs-changelog:
	@echo "Updating CHANGELOG from git history..."
	bash .cursor/skills/documentation-expert/scripts/update-changelog.sh $(VERSION)

# Release
release: clean build-agent-all build-cloud docs-version
	@echo "Creating release artifacts..."
	cd $(BUILD_DIR) && sha256sum * > checksums.txt
	@echo "Release artifacts ready in $(BUILD_DIR)/"
