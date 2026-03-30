# 🚀 QUICK START - Simulation Environment

**Version**: 0.2.0-sim  
**Frontend Port**: 3001 (changed to avoid conflict)  
**Status**: Ready to test

---

## Start in 4 Commands

```bash
# 1. Navigate to deployment folder
cd "/Users/tarun_vashishth/Documents/Test coding/deployment/docker"

# 2. Start all services (8 containers)
docker-compose -f docker-compose.simulation.yml up -d

# 3. Run automated tests
docker-compose -f docker-compose.simulation.yml --profile testing up test-runner

# 4. Open dashboard
open http://localhost:3001
```

**That's it!** Dashboard opens with real-time monitoring.

---

## What You'll See

### Dashboard (http://localhost:3001)

```
┌─────────────────────────────────────────────┐
│  Runtime AI Security Platform               │
├─────────────────────────────────────────────┤
│  📊 Real-Time Metrics                       │
│  • Events/sec: 120                          │
│  • Blocks/min: 8                            │
│  • Alerts/min: 15                           │
│  • Avg Latency: 4.2ms                       │
│                                             │
│  📡 Live Event Feed (WebSocket)             │
│  🔴 17:52 DENY  requsets@2.31.0            │
│  🟢 17:51 ALLOW lodash@4.17.21             │
│  🟡 17:50 ALERT shell_exec                 │
│                                             │
│  📈 Threat Timeline (Chart)                │
│  [Live updating chart visualization]        │
└─────────────────────────────────────────────┘
```

---

## Manual Testing

```bash
# Enter test container
docker exec -it simulation-test-app-1 bash

# Try typosquat (WILL BE BLOCKED)
npm install requsets --registry=http://mock-registry:4873

# Expected in dashboard:
# 🔴 DENY - Typosquat detected
# Confidence: 0.95

# Try benign package (WILL BE ALLOWED)
npm install lodash --registry=http://mock-registry:4873

# Expected in dashboard:
# 🟢 ALLOW - Package in allowlist
```

---

## Services Running

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3001 | http://localhost:3001 |
| Cloud API | 8080 | http://localhost:8080/health |
| Agent | 9090 | Internal |
| Mock Registry | 4873 | http://localhost:4873 |
| Ollama | 11434 | http://localhost:11434 |
| PostgreSQL | 5432 | Internal |

---

## Optional: Add LLM

```bash
# Pull model (4GB download, 2-5 minutes)
docker exec -it simulation-ollama-1 ollama pull qwen2.5-coder:7b

# Verify
docker exec -it simulation-ollama-1 ollama list

# Agent will automatically use LLM for uncertain verdicts
```

---

## Troubleshooting

### Port 3001 also busy?

Change to another port:
```bash
# Edit: deployment/docker/docker-compose.simulation.yml
# Line: "3001:80" → "3002:80"

# Restart
docker-compose -f docker-compose.simulation.yml up -d frontend

# Open new port
open http://localhost:3002
```

### Docker not starting?

```bash
# Check Docker running
docker ps

# If not:
open -a Docker  # Start Docker Desktop
# Wait 60 seconds, then retry
```

### Services not healthy?

```bash
# Check status
docker-compose -f docker-compose.simulation.yml ps

# View logs
docker-compose -f docker-compose.simulation.yml logs -f cloud-api
docker-compose -f docker-compose.simulation.yml logs -f runtime-agent
```

---

## Stop Everything

```bash
docker-compose -f docker-compose.simulation.yml down

# Or with cleanup:
docker-compose -f docker-compose.simulation.yml down -v  # Removes data
```

---

## Safety Note

**All test packages are 100% safe**:
- No actual malicious behavior
- Only harmless console.log mimics
- Verified by security review

**Test packages**:
- `requsets` - Typosquat mimic (safe)
- `malicious-script-test` - Suspicious script mimic (safe)

---

## Documentation

- [Complete Simulation Guide](../test/simulation/SIMULATION-GUIDE.md)
- [All Test Scenarios](../test/simulation/SCENARIOS.md)
- [Implementation Summary](../IMPLEMENTATION-SUMMARY-V0.2.md)
- [Visual Dashboard](../docs/SIMULATION-DASHBOARD.html)

---

**Ready!** Start with the 4 commands above, then explore the dashboard at **http://localhost:3001**
