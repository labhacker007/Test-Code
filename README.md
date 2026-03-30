# Runtime AI Security Platform

A lightweight endpoint agent and cloud control plane for **detection, prevention, and monitoring** of supply-chain attacks, malicious packages, IDE extensions, and AI tool abuse.

## Overview

This platform provides:
- **Real-time prevention**: Block malicious packages and extensions before execution
- **Behavioral detection**: Monitor file access, network connections, and AI tool usage
- **Enterprise integration**: OCSF-formatted events to XSIAM, Wiz, Splunk, and other SIEMs
- **Lightweight footprint**: <50MB binary, <100MB RAM at idle

## Architecture

```
Endpoint Agent (Go) → Cloud API (Go) → Analysis Pipeline → SIEM/CNAPP
     ↓                      ↓                                    ↓
Package/IDE/AI hooks   PostgreSQL            OCSF Events → XSIAM/Wiz
```

## Repository Structure

```
.
├── agent/                     # Endpoint agent (Go)
│   ├── cmd/agent/            # Agent binary entry point
│   ├── internal/
│   │   ├── hooks/            # Package manager and IDE hooks
│   │   ├── scanner/          # Package, extension, AI scanners
│   │   ├── policy/           # Policy engine
│   │   └── transport/        # Cloud communication
│   └── pkg/
│       ├── events/           # Event definitions and schema
│       └── rules/            # Rule engine and cache
├── cloud/                    # Cloud control plane (Go)
│   ├── cmd/api/             # API server entry point
│   ├── internal/
│   │   ├── ingestion/       # Event ingestion handlers
│   │   ├── analysis/        # Tiered analysis pipeline
│   │   ├── storage/         # PostgreSQL interface
│   │   └── ui/              # SOC dashboard
│   └── pkg/
│       ├── ocsf/            # OCSF event transformer
│       └── policy/          # Policy manager
├── rules/                    # Default policies
├── detection-rules/          # Rule documentation
├── docs/                     # Additional documentation
└── .cursor/skills/          # Security expert skills
```

## Documentation

📚 **[Complete Documentation Index](docs/INDEX.md)**

**Quick Links**:
- 🏗️ [Architecture Design](ARCHITECTURE.md) - System design and components
- 📋 [API Reference](docs/API.md) - REST endpoints and integration
- 📐 [Data Schemas](docs/SCHEMAS.md) - Event and policy formats
- 🚀 [Installation Guide](docs/INSTALLATION.md) - Install on endpoints
- 🚢 [Deployment Guide](docs/DEPLOYMENT.md) - Production setup
- 🧪 [Testing Plan](docs/TESTING-PLAN.md) - Test strategy with LLM integration
- 📜 [Changelog](CHANGELOG.md) - Version history and changes
- 🏛️ [Architecture History](docs/ARCHITECTURE-HISTORY.md) - Design evolution

**Documentation System**:
- ✅ Auto-updating diagrams (`make docs-generate`)
- ✅ Validation checks (`make docs-validate`)
- ✅ Version snapshots (`make docs-version`)
- ✅ Living documentation (stays current with code)

See [Documentation System Details](docs/DOCUMENTATION-SYSTEM.md)

---

## Quick Start

### Prerequisites

- Go 1.23+
- PostgreSQL 14+ (for cloud component)
- macOS, Linux, or Windows

### 1. Build Agent

```bash
cd agent
go mod download
go build -o bin/runtime-ai-agent ./cmd/agent

# Run agent
./bin/runtime-ai-agent \
  --cloud-endpoint=https://your-cloud-api.example.com \
  --mode=permissive \
  --policy-path=../rules/default-policy.json
```

### 2. Deploy Cloud

```bash
cd cloud
go mod download
go build -o bin/cloud-api ./cmd/api

# Set database connection
export DATABASE_URL="postgres://user:pass@localhost/runtime_ai_security?sslmode=require"

# Run API server
./bin/cloud-api
```

The API listens on `:8080`:
- `POST /v1/events` - Agent event ingestion
- `GET /v1/policy/:agent_id` - Policy distribution
- `GET /integration/ocsf/events` - OCSF export for SIEM
- `GET /health` - Health check

### 3. Access SOC Dashboard

Open `cloud/internal/ui/dashboard.html` in a browser (or serve via the API in production).

## Installation (Endpoints)

### macOS

```bash
# Install agent binary
sudo cp runtime-ai-agent /usr/local/bin/

# Create config directory
mkdir -p ~/.runtime-ai-security

# Copy policy
cp rules/default-policy.json ~/.runtime-ai-security/policy.json

# Optional: Install package manager shims
sudo cp agent/internal/hooks/shims/npm-wrapper.sh /usr/local/bin/npm-security
sudo cp agent/internal/hooks/shims/pip-wrapper.sh /usr/local/bin/pip-security
```

### Linux

```bash
# Install as systemd service
sudo cp runtime-ai-agent /usr/local/bin/
sudo cp deployment/systemd/runtime-ai-agent.service /etc/systemd/system/

# Start service
sudo systemctl daemon-reload
sudo systemctl enable runtime-ai-agent
sudo systemctl start runtime-ai-agent
```

## Configuration

### Agent Configuration

Create `~/.runtime-ai-security/config.yaml`:

```yaml
agent_id: auto  # Auto-generated if not specified
cloud_endpoint: https://api.runtime-ai-security.example.com
mode: permissive  # strict, permissive, audit_only
log_level: info

# Optional: Custom policy path
policy_path: /etc/runtime-ai-security/policy.json

# Optional: TLS client certificate for mTLS
tls:
  cert: /path/to/agent-cert.pem
  key: /path/to/agent-key.pem
  ca: /path/to/ca-cert.pem
```

### Cloud Configuration

Set environment variables:

```bash
export DATABASE_URL="postgres://user:pass@host:5432/dbname?sslmode=require"
export LISTEN_ADDR=":8080"
export LOG_LEVEL="info"

# Optional: SIEM webhook endpoints
export XSIAM_WEBHOOK_URL="https://tenant.xdr.us.paloaltonetworks.com/logs/v1/event"
export XSIAM_API_TOKEN="your-token"
export WIZ_WEBHOOK_URL="https://webhook.wiz.io/your-tenant"
```

## SIEM Integration

### XSIAM Integration

Configure webhook push in cloud API, or use API polling:

```bash
# XSIAM polls this endpoint every 5 minutes
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-cloud-api.example.com/integration/ocsf/events?since=2026-03-30T17:00:00Z
```

Events are OCSF 1.8.0 formatted:
- Category: Application Activity (6)
- Classes: API Activity (6003), Detection Finding (2004)

### Wiz Integration

Similar webhook configuration for Wiz Defend:

```bash
export WIZ_WEBHOOK_URL="https://webhook.wiz.io/..."
```

### Generic SIEM

Export OCSF events via API and import to Splunk HEC, Azure Sentinel, or other SIEM.

## Detection Rules

15 detection rules included in `rules/default-policy.json`:

**Supply Chain:**
- Typosquatting (npm: react, lodash; pip: requests)
- Malicious install scripts (curl+eval, obfuscation)

**Credentials:**
- SSH key access
- AWS credential access
- GitHub token access

**IDE:**
- Sideloaded extensions
- Wildcard activation events
- Excessive permissions

**AI:**
- Shell execution tool calls
- Blockchain C2 communication

See `detection-rules/README.md` for full reference.

## Operating Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| **permissive** | Allow + monitor uncertain items; block known-bad only | Dev environments, initial rollout |
| **strict** | Block uncertain items pending cloud verdict | Production, high-security teams |
| **audit_only** | Allow everything, log all events | Baselining, compliance evidence |

## Development

### Running Tests

```bash
# Agent tests
cd agent
go test ./...

# Cloud tests
cd cloud
go test ./...
```

### Building for Production

```bash
# Agent (cross-compile)
GOOS=darwin GOARCH=arm64 go build -o dist/agent-darwin-arm64 ./agent/cmd/agent
GOOS=linux GOARCH=amd64 go build -o dist/agent-linux-amd64 ./agent/cmd/agent

# Cloud
go build -o dist/cloud-api ./cloud/cmd/api
```

## Security

### Agent Security

- Binary signed (Apple/Microsoft/GPG)
- Runs as unprivileged user where possible
- Secrets stored in OS keychain (Keychain Access on macOS, Secret Service on Linux)
- Policy bundles verified with Ed25519 signatures

### Cloud Security

- mTLS for agent communication (recommended)
- PostgreSQL with TLS
- API authentication via bearer tokens
- Audit logging for all policy changes

### Data Privacy

- Agent sends **metadata and hashes** by default, not full source code
- PII redaction for usernames, paths (configurable)
- Events retained per org policy (30-90 days typical)

## Threat Model

See `ARCHITECTURE.md` for detailed threat model, including:
- Assets protected
- Attack vectors in scope
- Mitigations and residual risks

## Known Limitations (MVP)

- Package manager hooks require PATH manipulation (not transparent on Windows yet)
- eBPF hooks Linux-only (kernel 5.8+)
- LLM analysis tier not yet implemented (Phase 2)
- IDE integration requires manual sidecar extension install
- Policy signing keys demo-only (production needs HSM/KMS)

## Roadmap

**Phase 1 (MVP - Current):**
- Hash + rule-based detection
- npm/pip hooks (macOS/Linux)
- Basic OCSF export

**Phase 2 (Q2 2026):**
- LLM/SLM semantic analysis
- Reputation DB (package age, downloads)
- Bidirectional Wiz integration
- Windows support

**Phase 3 (Q3 2026):**
- MCP proxy mode for AI tool policy
- eBPF runtime provenance (Linux)
- Policy DSL with version control
- Multi-tenant cloud

## Support

- Issues: [GitHub Issues](https://github.com/labhacker007/Test-Code/issues)
- Documentation: `docs/`
- Architecture: `ARCHITECTURE.md`

## License

(To be determined - typically Apache 2.0 or MIT for security tooling)

## References

- [OCSF Schema](https://schema.ocsf.io/)
- [OWASP LLM Top 10](https://genai.owasp.org/)
- [MITRE ATT&CK](https://attack.mitre.org/)
- MALGUARD paper: [arxiv.org/pdf/2506.14466](https://arxiv.org/pdf/2506.14466)
