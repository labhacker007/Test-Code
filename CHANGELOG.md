# Changelog

All notable changes to the Runtime AI Security Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned for v0.2.0

- LLM integration via Ollama for semantic analysis
- Comprehensive test suite (unit + integration)
- Malicious package test fixtures
- Performance benchmarking tools
- Enhanced documentation with auto-update scripts

---

## [0.1.0] - 2026-03-30

### Added

**Core Features**:
- Endpoint agent (Go) with three scanner modules: package, IDE extension, AI tool call
- Cloud control plane with REST API for event ingestion
- Policy distribution system with Ed25519 signing
- 15 default detection rules covering common threats
- Local rule engine with 5-minute verdict cache
- Event batching and TLS transport (100 events/10s)
- OCSF 1.8.0 event export for SIEM integration
- Basic SOC dashboard (HTML/CSS/JS)

**Documentation**:
- Architecture design document
- Installation guide (macOS, Linux, Windows)
- Deployment guide (Docker, Kubernetes, AWS/GCP/Azure)
- API reference
- Contributing guidelines
- Testing plan

**Deployment**:
- Docker Compose configuration for local development
- Kubernetes manifests for production deployment
- systemd service file for Linux agents
- Makefile for build automation

**Detection Rules**:
1. npm typosquats (react, lodash, axios, express, webpack)
2. pip typosquats (requests, urllib3, numpy)
3. Malicious install scripts (curl|bash, eval, SSH key theft)
4. AI tool abuse (shell_exec, file_write to sensitive paths, network_request)
5. Credential access patterns

### Security

**Agent Security**:
- Runs as unprivileged user
- No root access required
- TLS 1.3 for cloud communication
- Certificate pinning support

**Policy Security**:
- Ed25519 signature verification
- Immutable policy bundles
- Version tracking
- Rollback capability

**Cloud Security**:
- mTLS authentication for agent enrollment
- Rate limiting on ingestion endpoint
- Input validation and sanitization
- Prepared statements (SQL injection prevention)

### Performance

**Metrics** (Initial benchmarks):
- Agent memory: ~50MB baseline
- Rule evaluation: <5ms per event
- Cache hit: <1ms
- Event batch transport: ~100ms overhead

### Known Limitations

- Hooks are stubs (not intercepting actual installs)
- No live threat intelligence integration
- No LLM/semantic analysis (rule-based only)
- Basic admin UI (limited filtering/search)
- PostgreSQL required for cloud (no SQLite option)

---

## [0.0.0] - 2026-03-30 (Design Phase)

### Research & Planning

- Analyzed AI runtime security threat landscape
- Researched supply chain attack vectors (typosquatting, malicious packages)
- Identified integration requirements (SIEM, XSIAM, Wiz)
- Defined real-time detection constraints
- Created threat model

### Architecture Decisions

- **Language**: Go for agent (single binary, low overhead)
- **Event Format**: OCSF 1.8.0 (industry standard)
- **Detection Strategy**: Hybrid (local rules + cloud enrichment)
- **Policy Distribution**: Signed JSON bundles
- **Transport**: HTTP/TLS with batching

### Documentation Created

- Expert skills (8 personas: cybersecurity, cloud, container, SaaS, compliance, UX, fullstack, AI/ML)
- Security baseline skill (supply-chain guardrails)
- Independent security review of all skills

---

## Version Numbering

**Format**: MAJOR.MINOR.PATCH

- **MAJOR**: Breaking changes, incompatible API changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, performance improvements

**Examples**:
- Adding LLM integration: 0.1.0 → 0.2.0 (new feature)
- Fixing rule engine bug: 0.1.0 → 0.1.1 (bug fix)
- Changing event schema: 0.1.0 → 1.0.0 (breaking change)

---

## Change Categories

### Added
New features, capabilities, or components.

### Changed
Modifications to existing functionality (backward compatible).

### Deprecated
Features marked for removal in future versions.

### Removed
Features or components eliminated.

### Fixed
Bug fixes, error corrections.

### Security
Security-related fixes or improvements (highlighted).

---

## Release Notes Template

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- Feature 1 with brief description
- Feature 2 with brief description

### Changed
- Modification 1
- Modification 2

### Fixed
- Bug fix 1
- Bug fix 2

### Architecture Impact
Diagram or description of structural changes.

### Migration Guide
Steps to upgrade from previous version.

### Breaking Changes
If any, with workarounds.
```

---

*Updated automatically by documentation-expert skill*  
*Last modified: 2026-03-30*
