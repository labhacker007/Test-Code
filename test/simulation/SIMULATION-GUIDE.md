# Docker Simulation Environment - Complete Guide

**Version**: 0.2.0  
**Date**: 2026-03-30  
**Purpose**: Safe testing environment with harmless mimics of malicious behavior

---

## Overview

Complete Docker-based simulation for testing Runtime AI Security Platform with:
- **Safe test packages** (mimics, no actual harm)
- **Real-time monitoring** frontend
- **Automated test runner**
- **LLM integration** (Ollama)

Inspired by research:
- **MEDUSA** (7,300+ patterns, 96.8% FP reduction)
- **Vigil AI SOC** (real-time threat hunting)
- **Sentinel AI** (sub-ms detection)

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│  SIMULATION ENVIRONMENT (Docker)                           │
│                                                            │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │ Test App    │───>│ Runtime      │───>│ Cloud API    │ │
│  │ (npm/pip)   │    │ Agent        │    │ (+ WebSocket)│ │
│  └─────────────┘    └──────────────┘    └───────┬──────┘ │
│         │                  │                     │        │
│         v                  v                     v        │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │ Mock        │    │ Ollama       │    │ PostgreSQL   │ │
│  │ Registry    │    │ (LLM)        │    │              │ │
│  └─────────────┘    └──────────────┘    └──────────────┘ │
│                                                 │          │
│                                                 v          │
│                                         ┌──────────────┐   │
│                                         │  Frontend    │   │
│                                         │  (React)     │   │
│                                         └──────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Docker Desktop running (or Docker Engine + Docker Compose)
- 8GB+ RAM available
- Ports available: 3000, 4873, 8080, 9090, 11434

### Start Environment

```bash
cd deployment/docker

# Start all services
docker-compose -f docker-compose.simulation.yml up -d

# Check status
docker-compose -f docker-compose.simulation.yml ps

# View logs
docker-compose -f docker-compose.simulation.yml logs -f
```

**Services started**:
- `mock-registry` - Verdaccio npm registry (port 4873)
- `test-app` - Victim application for testing
- `runtime-agent` - Security agent (port 9090)
- `postgres` - Database
- `cloud-api` - Cloud control plane (port 8080)
- `frontend` - React dashboard (port 3000)
- `ollama` - Local LLM (port 11434)

### Access Dashboard

```bash
open http://localhost:3000
```

**Features**:
- 📊 Real-time metrics (events/second, blocks, alerts)
- 📡 Live event feed (WebSocket)
- 🎯 Detection rule management
- 🛡️ Prevention controls (policy mode, emergency block)
- 👥 Agent fleet monitoring
- 📈 Threat timeline visualization

---

## Running Tests

### Automated Test Suite

```bash
# Run all test scenarios
docker-compose -f docker-compose.simulation.yml --profile testing up test-runner

# Results saved to: deployment/docker/results/
```

**Test scenarios** (10 total):
1. ✅ Typosquat detection (`requsets`)
2. ✅ Suspicious install script
3. ✅ Encoded payload
4. ✅ AI shell execution
5. ✅ Prompt injection
6. ✅ Benign control (lodash)
7. ✅ Unknown package (LLM analysis)
8. ✅ Loop detection
9. ✅ Repo poisoning
10. ✅ MCP security

### Manual Testing

```bash
# Access test application
docker exec -it simulation-test-app-1 bash

# Try installing typosquat
npm install requsets --registry=http://mock-registry:4873

# Expected output in dashboard:
# ❌ BLOCKED: Typosquat of 'requests' detected
# Rule: TYPOSQUAT_PIP_REQUESTS
# Confidence: 0.95
```

### Testing with Ollama

```bash
# Pull model in Ollama container
docker exec -it simulation-ollama-1 ollama pull qwen2.5-coder:7b

# Or use mistral
docker exec -it simulation-ollama-1 ollama pull mistral:7b-instruct

# Verify
docker exec -it simulation-ollama-1 ollama list

# Agent will automatically use Ollama at http://ollama:11434
```

---

## Safe Test Packages

All test packages are **completely safe** - they mimic malicious behavior without causing harm.

### Test Package 1: requsets (Typosquat)

**Location**: `test/simulation/test-packages/requsets/`

**Behavior**:
```javascript
// Prints mimic messages, no actual malicious actions
console.log("MIMIC: Would steal credentials");
console.log("MIMIC: Would connect to C2 server");

// Just logs to /tmp (safe)
fs.appendFileSync('/tmp/simulation-log.txt', 'Typosquat installed\\n');
```

**Detection trigger**: Package name edit distance from "requests"  
**Expected verdict**: DENY

### Test Package 2: malicious-script-test

**Location**: `test/simulation/test-packages/malicious-script-test/`

**Behavior**:
```javascript
// Lists suspicious patterns without executing them
const patterns = [
  "~/.ssh/id_rsa",           // Credential access pattern
  "curl http://evil.com",    // Network exfil pattern
  "eval(atob('...'))"        // Obfuscation pattern
];

console.log("MIMIC: Would execute:");
patterns.forEach(p => console.log(`  - ${p}`));

// Safe logging only
fs.appendFileSync('/tmp/simulation-log.txt', JSON.stringify({
  package: "malicious-script-test",
  patterns: patterns,
  action: "SIMULATED"
}));
```

**Detection triggers**:
- Credential path patterns
- Network command patterns
- Obfuscation indicators

**Expected verdict**: DENY

### Safety Verification

**No actual harm**:
- ❌ No real credential access (only echo/print)
- ❌ No network calls to external hosts (localhost only)
- ❌ No file deletion/modification (only /tmp logging)
- ❌ No code execution (only mimics via console.log)
- ✅ All behavior is simulated and logged

---

## Test Scenarios

### Scenario 1: Package Install Detection

```bash
# In test-app container
npm install requsets

# Frontend shows:
# Event type: package_install
# Package: requsets v2.31.0
# Verdict: DENY
# Reason: Typosquat of 'requests' (edit distance: 2)
# Rule: TYPOSQUAT_PIP_REQUESTS
# Confidence: 0.95
# Latency: 5ms (rule match)
```

### Scenario 2: AI Tool Call Monitoring

```bash
# Simulate via API
curl -X POST http://localhost:8080/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "manual-test",
    "events": [{
      "event_type": "ai_tool_call",
      "data": {
        "client": "cursor",
        "tool_name": "shell_exec",
        "args": {"command": "echo MIMIC: rm -rf /"}
      },
      "verdict": {
        "decision": "alert",
        "confidence": 0.9,
        "reason": "High-risk tool with destructive command pattern"
      }
    }]
  }'

# Frontend shows:
# Event type: ai_tool_call
# Tool: shell_exec
# Verdict: ALERT
# Dashboard highlight: High-risk AI tool usage detected
```

### Scenario 3: Real-Time Monitoring

1. Open dashboard: `http://localhost:3000`
2. Watch metrics update in real-time (WebSocket)
3. See events appear in feed
4. Review threat timeline chart
5. Check agent health status

### Scenario 4: Prevention Controls

**Test emergency block**:
1. Go to Prevention tab
2. Click "Emergency Block"
3. Enter package: `dangerous-package`
4. Confirm
5. Try installing: `npm install dangerous-package`
6. Verify: Blocked immediately (in denylist)

**Test policy mode**:
1. Switch from "Permissive" to "Blocking"
2. All uncertain verdicts now blocked (not just alerted)
3. Switch to "Monitor" - all allowed, only logged

---

## LLM Testing

### With Ollama

```bash
# 1. Ensure Ollama has model
docker exec -it simulation-ollama-1 ollama pull qwen2.5-coder:7b

# 2. Test LLM endpoint
curl http://localhost:11434/api/tags

# 3. Submit ambiguous package
curl -X POST http://localhost:8080/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "llm-test",
    "events": [{
      "event_type": "package_install",
      "data": {
        "ecosystem": "npm",
        "package_name": "obscure-analytics",
        "install_script": {
          "present": true,
          "content": "const fs = require(\"fs\"); console.log(\"Collecting metrics\");"
        }
      },
      "verdict": {
        "decision": "uncertain",
        "confidence": 0.5
      }
    }]
  }'

# 4. Frontend shows:
# Status: Analyzing with LLM...
# (After 2s) Verdict: ALLOW
# LLM confidence: 0.8
# Reason: Benign metrics collection, no suspicious patterns
```

---

## Frontend Features

### 1. Real-Time Dashboard

**Metrics** (auto-updating):
- Events per second
- Blocks per minute
- Alerts per minute
- Average latency
- Sub-millisecond detection rate

**Charts**:
- Threat timeline (Chart.js line chart)
- Throughput bar chart
- Detection coverage gauge

### 2. Event Feed

**Features**:
- Live stream via WebSocket
- Color-coded verdicts:
  - 🟢 Allow (green)
  - 🔴 Deny (red)
  - 🟡 Alert (yellow)
- Filters: verdict, event type, agent
- Search by package name, rule ID
- Row selection for detailed inspection
- Export to CSV/JSON

### 3. Detection Rules

**Current**: 15 rules loaded from policy

**Management**:
- List all rules with status
- Enable/disable rules
- View rule details (pattern, severity)
- Flag false positives
- Create custom rules

**Inspired by MEDUSA**:
- Target: 1000+ rules (from 15)
- Categories: Prompt injection, typosquats, MCP, repo poisoning
- FP reduction: Aim for 96%+ accuracy

### 4. Prevention Controls

**Policy Modes**:
- **Permissive**: Alert on deny, allow install
- **Monitor**: Log only, never block
- **Blocking**: Block deny verdicts

**Emergency Actions**:
- Emergency block (instant denylist add)
- Bulk allowlist management
- Quarantine review queue

### 5. Agent Fleet

**View**:
- All connected agents
- Health status (heartbeat within 60s)
- Last seen timestamp
- Events per agent
- Performance metrics

**Actions**:
- Drill down to agent-specific events
- View agent configuration
- Update agent policy

---

## Performance Benchmarks

### Expected Performance

| Metric | Target | Test Method |
|--------|--------|-------------|
| Rule evaluation | <10ms | Load test with 100 events/s |
| LLM analysis | <3s | Ollama with qwen2.5-coder |
| WebSocket latency | <100ms | Real-time event appearance |
| Frontend render | <50ms | React profiler |
| Agent memory | <100MB | Docker stats |
| Cloud API throughput | 1000+ events/s | Load test |

### Run Benchmarks

```bash
# Load test cloud API
docker run --rm --network deployment_testnet \
  -v $(pwd)/test/simulation/load-test.sh:/test.sh \
  alpine/bombardier:latest \
  /bin/sh /test.sh

# Monitor resources
docker stats

# Check agent memory
docker exec simulation-runtime-agent-1 ps aux
```

---

## Troubleshooting

### Frontend not connecting to API

**Check**:
```bash
# API reachable?
curl http://localhost:8080/health

# WebSocket working?
wscat -c ws://localhost:8080/ws

# Check logs
docker-compose -f docker-compose.simulation.yml logs cloud-api
```

**Fix**: Ensure CORS and WebSocket proxy configured in `frontend/vite.config.ts`

### Ollama model not found

```bash
# Check models
docker exec -it simulation-ollama-1 ollama list

# Pull model
docker exec -it simulation-ollama-1 ollama pull qwen2.5-coder:7b

# Test inference
docker exec -it simulation-ollama-1 ollama run qwen2.5-coder:7b "Analyze: print('hello')"
```

### Agent not detecting

**Check policy loaded**:
```bash
docker exec -it simulation-runtime-agent-1 cat /policies/default-policy.json | jq .rules | head
```

**Check agent logs**:
```bash
docker-compose -f docker-compose.simulation.yml logs runtime-agent | grep "Policy engine initialized"
```

### No events in dashboard

**Check WebSocket**:
- Browser console: Should see WebSocket connection message
- If failed: Falls back to demo stream (simulated data)

**Manually send event**:
```bash
./test/integration-test.sh
# Events should appear in dashboard
```

---

## Advanced Testing

### Custom Test Package

Create your own safe test package:

```bash
# In test/simulation/test-packages/my-test-pkg/

# package.json
{
  "name": "my-test-pkg",
  "version": "1.0.0",
  "scripts": {
    "postinstall": "node postinstall.js"
  }
}

# postinstall.js
console.log("MIMIC: Your test behavior here");
fs.appendFileSync('/tmp/simulation-log.txt', 'Custom test\\n');

# Add to mock registry
docker cp test-packages/my-test-pkg simulation-mock-registry-1:/verdaccio/storage/

# Install and test
docker exec simulation-test-app-1 npm install my-test-pkg
```

### Custom Detection Rule

**Add to frontend** (Detection tab → Create Rule):

```json
{
  "id": "CUSTOM_TEST_RULE",
  "type": "pattern_match",
  "severity": "high",
  "pattern": {
    "field": "data.package_name",
    "operator": "contains",
    "value": "malicious"
  },
  "action": "deny"
}
```

**Test**:
```bash
npm install malicious-test-package
# Should be blocked by custom rule
```

---

## Comparison: Before vs After

### Before (v0.1.0)

- ❌ Docker unavailable (org auth)
- ✅ Mock server (basic)
- ✅ Agent running
- ❌ Basic HTML dashboard
- ❌ No LLM
- ❌ No safe test packages

### After (v0.2.0)

- ✅ Complete Docker simulation
- ✅ Safe test packages (10 scenarios)
- ✅ Modern React frontend
- ✅ Real-time WebSocket updates
- ✅ Ollama LLM integration
- ✅ Automated test runner
- ✅ Performance benchmarking

---

## Services Overview

| Service | Port | Purpose | Health Check |
|---------|------|---------|--------------|
| frontend | 3000 | React dashboard | http://localhost:3000 |
| cloud-api | 8080 | Cloud control plane | http://localhost:8080/health |
| runtime-agent | 9090 | Security agent | Internal |
| mock-registry | 4873 | npm mock | http://localhost:4873 |
| postgres | 5432 | Database | Internal |
| ollama | 11434 | Local LLM | http://localhost:11434/api/tags |

---

## Test Data

### Included Test Packages

1. **requsets** - Typosquat mimic (safe)
2. **malicious-script-test** - Suspicious install script patterns (safe)

### To Add

Create more test packages in `test/simulation/test-packages/`:
- Encoded payloads (base64, hex)
- Dependency confusion
- Native module abuse
- Python .pth injection mimic
- Repo poisoning configs

---

## Development Workflow

### Test → Code → Verify Loop

```bash
# 1. Make agent changes
vim agent/internal/scanner/package.go

# 2. Rebuild
docker-compose -f docker-compose.simulation.yml build runtime-agent

# 3. Restart
docker-compose -f docker-compose.simulation.yml up -d runtime-agent

# 4. Run tests
docker-compose -f docker-compose.simulation.yml --profile testing up test-runner

# 5. View results in dashboard
open http://localhost:3000
```

### Frontend Development

```bash
# Local dev (hot reload)
cd frontend
npm run dev
# Open http://localhost:3000

# API proxied via Vite to http://localhost:8080
```

---

## Cleanup

```bash
# Stop all services
docker-compose -f docker-compose.simulation.yml down

# Remove volumes (clean slate)
docker-compose -f docker-compose.simulation.yml down -v

# Remove images
docker-compose -f docker-compose.simulation.yml down --rmi all
```

---

## Production Deployment

This simulation environment is for **testing only**. For production:

1. Use `deployment/docker/docker-compose.yml` (original)
2. Enable mTLS authentication
3. Use real PostgreSQL (not test credentials)
4. Deploy frontend to CDN (Vercel, Cloudflare Pages)
5. Enable rate limiting and DDoS protection

See: [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md)

---

## Next Steps

### Enhance Detection (Inspired by MEDUSA)

**Current**: 15 rules  
**Target**: 1000+ rules across 76 analyzers

**Categories to add**:
1. Prompt injection (800 patterns)
2. Repo poisoning (28+ config files)
3. MCP security (400 patterns)
4. Agent security (500 patterns)
5. RAG security (300 patterns)

See: [docs/RESEARCH-SECURITY-PROJECTS.md](../../docs/RESEARCH-SECURITY-PROJECTS.md)

### Enhance Frontend

**Add**:
- Investigation workspace (inspired by Vigil AI SOC)
- Threat hunting queries
- Automated response playbooks
- Integration with Slack/PagerDuty
- Advanced analytics (ML anomaly detection)

---

*Simulation environment provides safe, comprehensive testing of all capabilities.*  
*All test packages verified safe - no actual malicious behavior.*
