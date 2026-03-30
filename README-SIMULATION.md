# Runtime AI Security Platform

**Simulation Environment Status**  
**Version**: 0.2.0-sim  
**Last Updated**: 2026-03-30

---

## What's New in v0.2.0

### Docker Simulation Environment ✅

Complete testing environment with safe, harmless mimics:
- **Safe test packages**: Typosquats and suspicious scripts (no actual harm)
- **Automated test runner**: 10 test scenarios
- **LLM integration**: Ollama with security models
- **Real-time monitoring**: WebSocket event streaming

### Modern React Frontend ✅

Professional SOC dashboard inspired by **MEDUSA**, **Vigil AI SOC**, and **Sentinel AI**:
- 📊 Real-time metrics and threat timeline
- 📡 Live event feed (WebSocket)
- 🎯 Detection rule management (15 rules, expandable to 1000+)
- 🛡️ Prevention controls (policy mode, emergency block)
- 👥 Agent fleet monitoring
- 🔍 Investigation tools (search, export)

**Tech Stack**:
- React 18 + TypeScript
- Tailwind CSS (dark theme)
- Chart.js (visualizations)
- Zustand (state management)
- WebSocket (real-time)

**Access**: `http://localhost:3001`

---

## Quick Start (Simulation)

```bash
# Start full simulation environment
cd deployment/docker
docker-compose -f docker-compose.simulation.yml up -d

# Access dashboard
open http://localhost:3001

# Run automated tests
docker-compose -f docker-compose.simulation.yml --profile testing up test-runner

# View results in dashboard
```

**Services**:
- Frontend: http://localhost:3001
- Cloud API: http://localhost:8080
- Mock Registry: http://localhost:4873
- Ollama: http://localhost:11434

---

## Test Scenarios (All Safe)

1. ✅ **Typosquat** (`requsets`) - Mimics malicious package
2. ✅ **Suspicious script** - Logs patterns without executing
3. ✅ **Encoded payload** - Base64 detection test
4. ✅ **AI shell exec** - High-risk tool monitoring
5. ✅ **Prompt injection** - Context poisoning detection
6. ✅ **Benign control** (lodash) - False positive check
7. ✅ **Unknown package** - LLM analysis test
8. ✅ **Loop detection** - Repetitive tool calls
9. ✅ **Repo poisoning** - Config file tampering
10. ✅ **MCP security** - Unauthorized server detection

**Safety guarantee**: All test packages are completely harmless - they only print/log what they would do, without actual execution.

---

## Documentation (12+ Files)

📚 **[Complete Documentation Index](docs/INDEX.md)**

**New in v0.2.0**:
- [Simulation Guide](test/simulation/SIMULATION-GUIDE.md) - Docker testing environment
- [Security Research](docs/RESEARCH-SECURITY-PROJECTS.md) - MEDUSA, Vigil, Sentinel AI analysis
- [Test Scenarios](test/simulation/SCENARIOS.md) - Safe test cases

**Updated**:
- [Testing Plan](docs/TESTING-PLAN.md) - LLM integration strategy
- [API Reference](docs/API.md) - WebSocket endpoints
- [Changelog](CHANGELOG.md) - Version 0.2.0 features

**Documentation System**:
- ✅ Auto-updating diagrams (`make docs-generate`)
- ✅ Validation (`make docs-validate`)
- ✅ Version snapshots (`make docs-version`)
- ✅ Git hooks for automatic updates

---

## Research & Inspiration

### MEDUSA (Pantheon Security)

**Key learnings applied**:
- Multi-analyzer architecture (76+ analyzers)
- 7,300+ detection patterns
- 96.8% false positive reduction with 508 filters
- Repo poisoning detection (28+ config files)
- Real-time IDE integration

**What we implemented**:
- Modular analyzer framework
- Rule-based + LLM hybrid detection
- Config file scanning
- Real-time event streaming

### Vigil AI SOC

**Key learnings**:
- LLM-native SOC architecture
- 13 specialized AI agents
- Real-time threat hunting UI
- Multi-agent workflows

**What we implemented**:
- Real-time dashboard with WebSocket
- Event investigation tools
- Agent monitoring

### Sentinel AI

**Key learnings**:
- Sub-millisecond latency
- Regex-first (no heavy dependencies)
- Multi-language SDKs

**What we implemented**:
- Fast local rule path (<5ms)
- Cache for sub-ms repeated checks
- Lightweight agent design

---

## Architecture Evolution

### v0.1.0 → v0.2.0 Changes

**Added**:
- Docker simulation environment
- Modern React frontend (WebSocket)
- Safe test packages
- Automated test runner
- LLM integration support (Ollama)
- WebSocket hub for real-time updates

**Performance Impact**:
- Frontend: +React bundle (~200KB gzipped)
- Cloud API: +WebSocket hub (~10MB RAM)
- Simulation: +Ollama container (4GB when model loaded)

**Architecture**:
```
v0.1: Agent → Cloud API → PostgreSQL
v0.2: Agent → Cloud API → WebSocket → Frontend (real-time)
                ↓
           Ollama LLM (semantic analysis)
```

---

## Next Steps

### Immediate

1. **Test simulation environment** (if Docker available)
2. **Pull Ollama model**: `qwen2.5-coder:7b`
3. **Run automated tests**
4. **Explore frontend features**

### Short-term

1. **Expand detection rules** (15 → 100 → 1000+)
2. **Add FP reduction filters** (inspired by MEDUSA)
3. **Implement loop detection** (Reivo-Guard pattern)
4. **Add more test scenarios**

### Long-term

1. **Production deployment** (K8s, cloud providers)
2. **Real SIEM integration** (XSIAM, Wiz, Splunk)
3. **Advanced analytics** (ML-based anomaly detection)
4. **Threat intelligence** (reputation DB, threat feeds)

---

## Commands Reference

### Simulation

```bash
# Start
docker-compose -f deployment/docker/docker-compose.simulation.yml up -d

# Test
docker-compose -f deployment/docker/docker-compose.simulation.yml --profile testing up test-runner

# Logs
docker-compose -f deployment/docker/docker-compose.simulation.yml logs -f [service]

# Stop
docker-compose -f deployment/docker/docker-compose.simulation.yml down
```

### Frontend Development

```bash
cd frontend
npm install    # First time only
npm run dev    # Development server
npm run build  # Production build
```

### Documentation

```bash
make docs-generate   # Generate diagrams
make docs-validate   # Validate consistency
make docs-version    # Create version snapshot
```

---

## File Structure

```
Test coding/
├── frontend/                      # NEW: Modern React dashboard
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── services/api.ts
│   │   └── store/useStore.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── test/simulation/               # NEW: Safe testing environment
│   ├── SIMULATION-GUIDE.md
│   ├── SCENARIOS.md
│   ├── test-packages/
│   │   ├── requsets/             # Safe typosquat mimic
│   │   └── malicious-script-test/ # Safe malicious mimic
│   ├── Dockerfile.testapp
│   ├── Dockerfile.registry
│   ├── Dockerfile.runner
│   └── test-runner.sh
│
├── deployment/docker/
│   └── docker-compose.simulation.yml  # NEW: Full simulation stack
│
├── cloud/internal/websocket/      # NEW: Real-time updates
│   └── hub.go
│
└── docs/
    ├── RESEARCH-SECURITY-PROJECTS.md  # NEW: MEDUSA, Vigil research
    ├── DOCUMENTATION-SUMMARY.md
    └── SIMULATION-GUIDE.md
```

---

## Support

- **Documentation**: [docs/INDEX.md](docs/INDEX.md)
- **Simulation Guide**: [test/simulation/SIMULATION-GUIDE.md](test/simulation/SIMULATION-GUIDE.md)
- **Testing Plan**: [docs/TESTING-PLAN.md](docs/TESTING-PLAN.md)
- **API Reference**: [docs/API.md](docs/API.md)

---

**Ready to test!** Start the simulation environment and open the dashboard at `http://localhost:3001`.
