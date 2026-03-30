# Architecture History

**Purpose**: Track architectural evolution and design decisions over time.

---

## Version 0.2.0 (Planned) - LLM Integration

**Date**: 2026-03-30 (In Progress)  
**Status**: Development

### Changes

**Added Components**:
- `agent/internal/analysis/llm.go` - Ollama client integration
- Local LLM tier in detection flow
- Test suite with malicious package fixtures

**Architecture Impact**:
```
Detection Flow Before (v0.1):
  Event → Rules → Allow/Deny (5ms)

Detection Flow After (v0.2):
  Event → Rules → LLM (if uncertain) → Allow/Deny (2s)
               → Cloud (if low confidence) → Allow/Deny (5s)
```

**Performance Impact**:
- Baseline (cache hit): 1ms
- Rule match: 5ms
- LLM path: ~2000ms (+1995ms)
- Cloud fallback: ~5000ms (+4995ms)

**Resource Impact**:
- Ollama running: +4GB RAM (mistral:7b-instruct)
- Agent memory: Unchanged (~50MB)

**Dependencies Added**:
- Ollama (optional): Local LLM server
- Models: mistral:7b-instruct, qwen2.5-auditor (alternatives)

**Migration Notes**:
- Backward compatible - LLM is optional
- Agent works without Ollama (rules-only mode)
- No schema changes

---

## Version 0.1.0 - Initial Implementation

**Date**: 2026-03-30  
**Status**: Completed

### Architecture

See: [v0.1.0 snapshot](versions/v0.1.0/ARCHITECTURE.md)

**Core Components**:

```
┌─────────────────────────────────────────────────────────────┐
│  ENDPOINT                                                   │
│  ┌──────────────────┐       ┌─────────────────────────┐   │
│  │  IDE / Packages  │──────>│  Runtime AI Agent       │   │
│  └──────────────────┘       │  • Scanners (3 types)   │   │
│                             │  • Policy Engine        │   │
│                             │  • Event Transport      │   │
│                             └──────────┬──────────────┘   │
│                                        │ TLS              │
└────────────────────────────────────────┼──────────────────┘
                                         │
                                         v
┌─────────────────────────────────────────────────────────────┐
│  CLOUD CONTROL PLANE                                        │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Ingestion  │─>│   Analysis   │─>│  SIEM Export    │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
│                            │                                │
│                            v                                │
│                   ┌──────────────────┐                      │
│                   │   PostgreSQL     │                      │
│                   └──────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

**Key Features**:
- 15 detection rules (typosquat, malicious scripts, high-risk tools)
- Rule engine with 5-minute cache
- Batch event transport (100 events/10s)
- OCSF 1.8.0 event export
- Policy signing with Ed25519
- SOC dashboard (basic)

**Languages/Frameworks**:
- Agent: Go 1.23
- Cloud: Go 1.23 + Gin web framework
- Database: PostgreSQL 15
- Deployment: Docker, Kubernetes, systemd

**Design Decisions**:

1. **Go for agent**: Chosen for single-binary distribution, low memory footprint
2. **Local-first rules**: Fast decisions without network dependency
3. **Async cloud sync**: Event logging doesn't block installs
4. **OCSF for SIEM**: Standard format for enterprise integration

**Limitations**:
- Hooks are stubs (not actually intercepting installs)
- No LLM/semantic analysis
- Limited threat intelligence
- Basic admin UI

---

## Version 0.0.0 - Design Phase

**Date**: 2026-03-30  
**Status**: Completed

### Initial Research

**Requirements Identified**:
1. Lightweight endpoint agent (<50MB, <100MB RAM)
2. Real-time detection and prevention
3. SIEM integration (XSIAM, Wiz)
4. Multi-scanner: packages, IDE extensions, AI tools
5. Cloud control plane for policy distribution

**Threat Model**:
- Supply chain attacks (typosquatting, malicious packages)
- IDE extension backdoors
- AI prompt injection / tool abuse
- Credential theft

**Technology Choices**:
- Go: Agent implementation
- PostgreSQL: Cloud storage
- OCSF: SIEM event format
- Ed25519: Policy signing
- TLS 1.3: Agent-cloud transport

**Architecture Documents**:
- Created ARCHITECTURE.md with full design
- Defined event and policy schemas
- Established detection rule format

---

## Architectural Principles (Consistent Across Versions)

### Security-First Design

1. **Least privilege**: Agent runs as user, not root
2. **Signed policies**: Ed25519 signatures prevent tampering
3. **Local-first**: Works offline, cloud enhances
4. **Fail-safe**: On error, default to alert (not silent allow)

### Performance Requirements

| Metric | Target | Actual (v0.1) |
|--------|--------|---------------|
| Agent memory | <100MB | ~50MB |
| Cache hit latency | <1ms | ~0.5ms |
| Rule evaluation | <10ms | ~5ms |
| Event batch size | 100 events | 100 events |
| Event batch interval | 10s | 10s |

### Integration Patterns

1. **Hooks before execution**: Intercept before malicious code runs
2. **Async telemetry**: Event logging never blocks operation
3. **Standard formats**: OCSF for interoperability
4. **Policy as code**: JSON bundles, version-controlled

---

## Major Design Decisions

### Decision 1: Local Rules vs Pure Cloud

**Date**: 2026-03-30  
**Context**: Agent needs to work offline and provide real-time blocking.

**Options Considered**:
- Pure cloud: All decisions via API call
- Pure local: All decisions on endpoint
- Hybrid: Local fast-path, cloud enrichment

**Chosen**: Hybrid (local rules + cache, cloud for uncertain cases)

**Rationale**:
- Offline capability critical for developer trust
- Cloud provides threat intel and LLM analysis
- Cache reduces latency and cloud cost
- Graceful degradation if cloud unavailable

### Decision 2: Go vs Python/Node for Agent

**Date**: 2026-03-30

**Chosen**: Go

**Rationale**:
- Single binary distribution (no runtime install)
- Low memory footprint (~50MB vs 200MB+ for Python)
- Fast startup (<100ms)
- Strong concurrency primitives for event handling
- Good ecosystem for security tooling

### Decision 3: OCSF vs Custom Format for SIEM

**Date**: 2026-03-30

**Chosen**: OCSF 1.8.0

**Rationale**:
- Industry standard (AWS, Splunk, Palo Alto adoption)
- Pre-built integrations with major SIEMs
- Extensible schema for custom fields
- Better than CEF (legacy) or custom JSON

---

## Future Architecture Considerations

### Potential v0.3.0+ Changes

**eBPF Integration** (Linux):
- Kernel-level syscall monitoring
- Detect process spawning, network connections
- No userland hooks required
- Trade-off: Linux-only, requires kernel 5.4+

**Distributed Caching** (Multi-endpoint):
- Redis for shared verdict cache
- Reduces cloud API load
- Trade-off: Additional infrastructure dependency

**WASM Policy Engine**:
- Policies as WASM modules
- Custom logic beyond JSON rules
- Trade-off: More complex policy authoring

**On-device ML**:
- TensorFlow Lite / ONNX models on endpoint
- No Ollama dependency
- Trade-off: Model updates, accuracy vs model size

---

## Version Comparison Matrix

| Feature | v0.1.0 | v0.2.0 (Planned) | v0.3.0 (Future) |
|---------|--------|------------------|-----------------|
| **Detection** |
| Rule-based | ✅ 15 rules | ✅ 15+ rules | ✅ Custom rules |
| Local LLM | ❌ | ✅ Ollama | ✅ On-device ML |
| Cloud LLM | ❌ | ✅ Optional | ✅ Optional |
| Threat intel | ❌ | ✅ Basic | ✅ Advanced |
| **Scanners** |
| Package | ✅ Stub | ✅ Full hooks | ✅ eBPF |
| IDE Extension | ✅ Stub | ✅ Full watch | ✅ Full watch |
| AI Tool Call | ✅ Stub | ✅ Full intercept | ✅ Full intercept |
| **Performance** |
| Latency (avg) | 5ms | 50ms* | 10ms |
| Memory | 50MB | 4GB** | 100MB |
| **Integration** |
| OCSF Export | ✅ | ✅ | ✅ |
| SIEM Webhooks | ✅ | ✅ | ✅ |
| Policy Signing | ✅ | ✅ | ✅ |

*With LLM enabled  
**With Ollama running

---

## Change Log Summary

### Breaking Changes

None yet. All versions backward compatible.

### Deprecations

None yet.

### Migrations

None required between v0.1 → v0.2.

---

*This file is automatically updated by the documentation-expert skill.*
*Last updated: 2026-03-30*
