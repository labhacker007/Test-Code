# Frontend Status - Port 3001

**Status**: ✅ Running  
**Mode**: Demo data (WebSocket unavailable)  
**URL**: http://localhost:3001

---

## Current Setup

### Services Running

| Service | Port | Status | URL |
|---------|------|--------|-----|
| Frontend (Vite) | 3001 | ✅ Running | http://localhost:3001 |
| Mock Cloud API | 8080 | ✅ Running | http://localhost:8080 |

### Why Demo Mode?

The mock cloud server (`dist/mock-cloud`) doesn't have WebSocket support, so the frontend automatically falls back to **demo data mode** where it:
- Generates simulated events for demonstration
- Shows all UI features working
- Updates metrics in real-time
- Displays example detection scenarios

This is **intentional** - you can explore the full UI without needing the complete backend.

---

## What You Should See

Open **http://localhost:3001** in your browser. You'll see:

### Dashboard View
- 📊 **Real-time metrics** (simulated):
  - Events per second
  - Blocks per minute
  - Alerts per minute
  - Average latency
- 📈 **Threat timeline chart** (Chart.js)
- 🎯 **Detection coverage** (15 rules)
- 👥 **Agent fleet** (3 demo agents)

### Event Feed
- 🔴 **DENY verdicts** (red) - Blocked packages
- 🟢 **ALLOW verdicts** (green) - Safe packages
- 🟡 **ALERT verdicts** (yellow) - Suspicious activity
- Filterable by verdict, type, agent
- Searchable
- Export to CSV/JSON

### Detection Rules
- 15 rules loaded from policy
- Enable/disable toggles
- Create custom rules form
- False positive flagging
- Statistics (inspired by MEDUSA: 7,300 rules target)

### Prevention Controls
- Policy mode: Permissive / Monitor / Blocking
- Emergency block button
- Allowlist management
- Denylist management
- Quarantine queue

### Agent Fleet
- Agent health status
- Last seen timestamps
- Events per agent
- Drill-down to agent-specific events

---

## To Get Real WebSocket (Full Backend)

### Option 1: Run Full Cloud API (Without Docker)

The mock cloud doesn't have WebSocket. To get real WebSocket:

```bash
# Stop mock cloud
kill 75745

# Start full cloud API
cd cloud
export DATABASE_URL="postgres://admin:changeme@localhost:5432/runtime_ai_security?sslmode=disable"
# Or use SQLite: export DATABASE_URL="file:./test.db?cache=shared&mode=rwc"

go run ./cmd/api
```

**Note**: Requires PostgreSQL running or SQLite

### Option 2: Wait for Docker Auth

When your Docker Desktop authentication is resolved, run:
```bash
cd deployment/docker
docker-compose -f docker-compose.simulation.yml up -d
```

This will give you the full stack with WebSocket.

---

## Current State

**What's Working**:
- ✅ Frontend UI fully functional (demo mode)
- ✅ Mock cloud API (REST only, no WebSocket)
- ✅ All UI components rendering
- ✅ Demo data showing all features
- ✅ Charts updating
- ✅ Interactive controls

**What's in Demo Mode**:
- ⚠️ Events are simulated (not from real agent)
- ⚠️ WebSocket shows "Disconnected" (expected)
- ⚠️ Demo stream badge visible

**To Get Full Real-Time**:
- Need full cloud API with WebSocket
- OR wait for Docker authentication

---

## Quick Commands

### Check Frontend Logs
```bash
# View Vite dev server output
tail -f "/Users/tarun_vashishth/.cursor/projects/Users-tarun-vashishth-Documents-Test-coding/terminals/208324.txt"
```

### Send Test Events to Mock Cloud
```bash
# The mock cloud accepts events via REST
./test/integration-test.sh

# Or manually
curl -X POST http://localhost:8080/v1/events \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "test", "events": [...]}'
```

### Access Frontend
```bash
open http://localhost:3001
```

---

## What to Explore

Even in demo mode, you can:

1. **Navigate all tabs**: Dashboard, Events, Detection, Prevention, Agents
2. **Interact with controls**: Toggle rules, switch policy modes
3. **See visualizations**: Charts, timelines, metrics
4. **Test UI features**: Search, filter, export
5. **Review design**: Professional SOC theme, responsive layout

---

**The frontend is working!** Open **http://localhost:3001** to explore the full UI in demo mode while we resolve the backend connection.
