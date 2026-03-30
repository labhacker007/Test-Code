# Runtime AI Security Platform - Documentation Index

**Version**: 0.1.0  
**Last Updated**: 2026-03-30  
**Status**: Active Development

---

## Quick Links

### Getting Started
- 📖 [README](../README.md) - Project overview and quick start
- 🚀 [Installation Guide](INSTALLATION.md) - Install agent on endpoints
- 🏗️ [Architecture Overview](../ARCHITECTURE.md) - System design and components
- 📋 [Project Summary](../PROJECT-SUMMARY.md) - High-level feature summary

### Development
- 🔧 [Contributing Guide](../CONTRIBUTING.md) - How to contribute
- 🧪 [Testing Plan](TESTING-PLAN.md) - Test strategy and LLM integration
- 📊 [Test Results](../TEST-RESULTS.md) - Latest test outcomes
- 🏗️ [Build Status](../BUILD-STATUS.md) - Compilation and build verification

### Operations
- 🚢 [Deployment Guide](DEPLOYMENT.md) - Production deployment (AWS/GCP/Azure/K8s)
- 📡 [API Reference](API.md) - REST API endpoints and examples
- 📐 [Schemas Reference](SCHEMAS.md) - Event and policy schemas
- 🔗 [OCSF Examples](OCSF-EXAMPLES.md) - SIEM integration examples
- 📝 [Local Testing](LOCAL-TESTING.md) - Test without Docker

### Governance
- 📜 [Changelog](../CHANGELOG.md) - Version history and changes
- 🏛️ [Architecture History](ARCHITECTURE-HISTORY.md) - Design evolution
- 🔒 [Security Skills Review](../.cursor/skills/SKILL-SECURITY-REVIEW.md) - AI agent skill audit

---

## Documentation Structure

```
Runtime AI Security Platform/
│
├── README.md                    ← Start here
├── ARCHITECTURE.md              ← System design (versioned)
├── CHANGELOG.md                 ← Version history
├── CONTRIBUTING.md              ← Contribution guide
├── PROJECT-SUMMARY.md           ← Executive overview
├── TEST-RESULTS.md              ← Latest test results
├── BUILD-STATUS.md              ← Build verification
│
├── docs/                        ← Detailed documentation
│   ├── INDEX.md                 ← This file
│   ├── INSTALLATION.md          ← Agent installation
│   ├── DEPLOYMENT.md            ← Production deployment
│   ├── TESTING-PLAN.md          ← Test strategy
│   ├── API.md                   ← REST API reference
│   ├── SCHEMAS.md               ← Data schemas
│   ├── OCSF-EXAMPLES.md         ← SIEM integration
│   ├── LOCAL-TESTING.md         ← Local test setup
│   ├── ARCHITECTURE-HISTORY.md  ← Design evolution
│   │
│   └── versions/                ← Version snapshots
│       └── v0.1.0/
│           ├── ARCHITECTURE.md
│           └── VERSION_INFO.md
│
├── detection-rules/             ← Detection rule documentation
│   └── README.md
│
├── test/                        ← Testing resources
│   ├── integration-test.sh
│   └── fixtures/
│
└── .cursor/skills/              ← AI agent skills
    ├── documentation-expert/    ← Auto-doc system
    ├── cybersecurity-expert/
    ├── ai-ml-expert/
    └── [8 expert skills total]
```

---

## Documentation by Audience

### For Security Teams

**Threat Understanding**:
- [Architecture - Threat Model](../ARCHITECTURE.md#threat-model)
- [Detection Rules](../detection-rules/README.md) - MITRE ATT&CK mappings

**Integration**:
- [OCSF Examples](OCSF-EXAMPLES.md) - SIEM event formats
- [API Reference](API.md) - Webhook configuration

**Operations**:
- [Deployment Guide](DEPLOYMENT.md) - Production setup
- Test Results - Validation data

### For Developers

**Setup**:
- [README](../README.md) - Quick start
- [Installation](INSTALLATION.md) - Endpoint setup
- [Local Testing](LOCAL-TESTING.md) - Dev environment

**Architecture**:
- [Architecture](../ARCHITECTURE.md) - Full system design
- [API Reference](API.md) - Integration points
- [Schemas](SCHEMAS.md) - Data formats

**Contributing**:
- [Contributing Guide](../CONTRIBUTING.md) - Code standards
- [Testing Plan](TESTING-PLAN.md) - Test approach

### For Executives/Decision Makers

**Overview**:
- [Project Summary](../PROJECT-SUMMARY.md) - Features and status
- [Architecture - Executive Summary](../ARCHITECTURE.md#executive-summary)

**Security Posture**:
- [Architecture - Threat Model](../ARCHITECTURE.md#threat-model)
- [Skills Security Review](../.cursor/skills/SKILL-SECURITY-REVIEW.md)

**Compliance**:
- [Architecture - Security Model](../ARCHITECTURE.md#security-model)
- Detection Rules - Control mappings

---

## Key Concepts

### Agent
Lightweight endpoint software that intercepts package installs, IDE extensions, and AI tool calls. Evaluates against local policy and reports to cloud.

### Policy
JSON bundle containing detection rules, allowlists, and denylists. Signed with Ed25519, distributed by cloud, cached locally on agent.

### Verdict
Decision made by agent: `allow` (permitted), `deny` (blocked), `alert` (suspicious but allowed in permissive mode).

### Rule
Pattern-matching or heuristic logic for detecting threats. 15 default rules cover typosquatting, malicious scripts, and high-risk AI tools.

### OCSF
Open Cybersecurity Schema Framework - standardized event format for SIEM integration.

### Tiered Analysis
Detection strategy: local rules (fast) → local LLM (semantic) → cloud LLM (deep analysis).

---

## Version-Specific Documentation

### Current Version: 0.1.0

**Architecture**: [ARCHITECTURE.md](../ARCHITECTURE.md)  
**Features**: Rule-based detection, no LLM integration yet  
**Status**: MVP complete, tested locally

### Upcoming Version: 0.2.0 (Planned)

**Major Changes**: LLM integration via Ollama  
**Preview**: [Architecture History](ARCHITECTURE-HISTORY.md#version-020-planned---llm-integration)  
**Status**: Planning phase

### Historical Versions

- [v0.1.0](versions/v0.1.0/ARCHITECTURE.md) - Initial implementation
- v0.0.0 - Design phase (see ARCHITECTURE-HISTORY.md)

---

## Documentation Maintenance

### Auto-Update System

**Enabled**: Documentation expert skill active

**Auto-updates**:
- Architecture diagrams when components change
- API docs when endpoints added
- Schema docs when event formats change
- Component lists when files added

**Manual updates**:
- Changelog (on release)
- Testing results (after test runs)
- Deployment guides (when infrastructure changes)

### How to Update Docs

**Generate architecture diagrams**:
```bash
make docs-generate
# Creates docs/ARCHITECTURE-AUTO.md
```

**Validate documentation**:
```bash
make docs-validate
# Checks:
# - Required files present
# - No broken links
# - Version consistency
# - Diagram presence
```

**Create version snapshot**:
```bash
make docs-version VERSION=0.2.0
# Saves to docs/versions/v0.2.0/
```

**Update changelog**:
```bash
make docs-changelog VERSION=0.2.0
# Generates from git commits
```

### Git Hook (Optional)

**Auto-check docs on commit**:
```bash
# Link post-commit hook
ln -s ../../.cursor/skills/documentation-expert/scripts/auto-update-docs.sh \
      .git/hooks/post-commit

# Now docs are checked on every commit
```

---

## Contributing to Documentation

### Guidelines

1. **Keep docs DRY**: Single source of truth for each concept
2. **Link, don't duplicate**: Reference other docs instead of copying
3. **Version snapshots**: Create before major changes
4. **Test examples**: All code examples must be tested
5. **Diagrams current**: Update diagrams when architecture changes

### Documentation Style

- **Audience**: Assume technical (software engineers, security engineers)
- **Tone**: Direct, precise, no fluff
- **Examples**: Concrete, tested, with expected output
- **Diagrams**: ASCII for universal rendering, Mermaid for GitHub
- **Code blocks**: Always specify language

### Pull Request Checklist

When submitting code changes:

- [ ] Updated relevant docs in same PR
- [ ] Ran `make docs-validate`
- [ ] Added entry to CHANGELOG.md (unreleased section)
- [ ] Updated ARCHITECTURE.md if structural change
- [ ] Added examples for new features

---

## Finding Information

### Quick Reference

**Question**: "How do I install the agent?"  
**Answer**: [INSTALLATION.md](INSTALLATION.md)

**Question**: "What detection rules exist?"  
**Answer**: [detection-rules/README.md](../detection-rules/README.md)

**Question**: "How do I integrate with XSIAM?"  
**Answer**: [OCSF-EXAMPLES.md](OCSF-EXAMPLES.md) + [API.md](API.md)

**Question**: "How does the architecture work?"  
**Answer**: [ARCHITECTURE.md](../ARCHITECTURE.md)

**Question**: "How do I test locally?"  
**Answer**: [LOCAL-TESTING.md](LOCAL-TESTING.md) + [TESTING-PLAN.md](TESTING-PLAN.md)

**Question**: "What's the event format?"  
**Answer**: [SCHEMAS.md](SCHEMAS.md)

**Question**: "How do I deploy to production?"  
**Answer**: [DEPLOYMENT.md](DEPLOYMENT.md)

### Search Tips

```bash
# Find specific terms in docs
grep -r "OCSF" docs/

# Find API endpoint documentation
grep -r "POST /v1" docs/

# Find security-related docs
grep -r "threat" docs/ ARCHITECTURE.md
```

---

## External Resources

### Standards & Frameworks

- [OCSF Schema Browser](https://schema.ocsf.io/) - OCSF 1.8.0 reference
- [MITRE ATT&CK](https://attack.mitre.org/) - Threat tactics and techniques
- [Semantic Versioning](https://semver.org/) - Version numbering

### Security Research

- [OWASP Top 10 for LLM](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [Backstabber's Knife Collection](https://github.com/datadog/malicious-software-packages-dataset) - Malicious packages dataset
- [Socket.dev Research](https://socket.dev/research) - Supply chain attacks

### Tools

- [Ollama](https://ollama.com/) - Local LLM runtime
- [malwi](https://github.com/schirrmacher/malwi) - Python malware scanner
- [SecureBERT](https://huggingface.co/cisco-ai/SecureBERT2.0-code-vuln-detection) - Code vulnerability detection

---

## Support

### Documentation Issues

Found outdated docs or broken links?

1. Run validation: `make docs-validate`
2. Check version: Ensure you're viewing current version docs
3. Report issue: Include doc file path and description

### Documentation Requests

Need docs that don't exist?

1. Check if it's in planning: [ARCHITECTURE-HISTORY.md](ARCHITECTURE-HISTORY.md)
2. Check if it's version-specific: [versions/](versions/)
3. Request via issue with template:
   - **Title**: "Docs: [Topic]"
   - **Audience**: Who needs it
   - **Purpose**: What question it answers

---

*This index is maintained by the documentation-expert skill.*  
*Last updated: 2026-03-30*  
*Documentation version: 1.0*
