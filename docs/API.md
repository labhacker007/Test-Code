# API Reference

**Version**: 0.1.0  
**Base URL**: `http://localhost:8080` (local) | `https://api.your-domain.com` (production)  
**Authentication**: mTLS (mutual TLS) for agents  
**Format**: JSON

---

## Endpoints

### Health Check

```http
GET /health
```

Check API server health status.

**Response** (200 OK):
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "time": "2026-03-30T21:30:00Z"
}
```

**Example**:
```bash
curl http://localhost:8080/health
```

---

### Submit Events

```http
POST /v1/events
```

Submit security events from agent to cloud.

**Request Body**:
```json
{
  "agent_id": "agent-hostname-12345",
  "events": [
    {
      "version": "1.0",
      "event_id": "uuid",
      "event_type": "package_install",
      "timestamp": "2026-03-30T21:30:00Z",
      "agent_id": "agent-hostname-12345",
      "agent_version": "0.1.0",
      "device": {
        "hostname": "dev-laptop",
        "os": "darwin",
        "os_version": "25.4.0",
        "arch": "arm64",
        "user": "developer"
      },
      "data": {
        "ecosystem": "npm",
        "package_name": "lodash",
        "version": "4.17.21",
        "registry": "https://registry.npmjs.org",
        "install_script": {
          "present": false
        }
      },
      "verdict": {
        "decision": "allow",
        "confidence": 1.0,
        "reason": "Package in allowlist",
        "rule_id": "ALLOWLIST"
      }
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "status": "accepted",
  "events_received": 1
}
```

**Event Types**:
- `package_install` - Package manager installation
- `extension_install` - IDE extension installation
- `ai_tool_call` - AI tool execution
- `agent_heartbeat` - Periodic agent health check
- `agent_startup` - Agent initialization
- `agent_shutdown` - Agent termination

**Verdict Decisions**:
- `allow` - Permitted by policy
- `deny` - Blocked by policy
- `alert` - Logged for review (allowed but suspicious)

**Example**:
```bash
curl -X POST http://localhost:8080/v1/events \
  -H "Content-Type: application/json" \
  -d @test/fixtures/sample-event.json
```

---

### Request Policy

```http
GET /v1/policy/:agent_id
```

Retrieve current policy bundle for an agent.

**Response** (200 OK):
```json
{
  "version": "1.0",
  "policy_id": "default-detection-rules-v1",
  "issued_at": "2026-03-30T12:00:00Z",
  "expires_at": "2026-04-06T12:00:00Z",
  "mode": "permissive",
  "signature": "ed25519_signature_base64",
  "rules": [
    {
      "id": "NPM_TYPOSQUAT_REACT",
      "type": "pattern_match",
      "severity": "high",
      "enabled": true,
      "pattern": {
        "field": "data.package_name",
        "operator": "fuzzy_match",
        "value": "react",
        "threshold": 0.8
      },
      "action": "deny"
    }
  ],
  "allowlist": {
    "packages": [
      {"ecosystem": "npm", "name": "react"},
      {"ecosystem": "npm", "name": "lodash"}
    ],
    "hashes": [],
    "domains": ["registry.npmjs.org", "pypi.org"]
  },
  "denylist": {
    "packages": [],
    "hashes": ["sha256:malicious_hash"],
    "domains": ["evil.example.com"]
  }
}
```

**Example**:
```bash
curl http://localhost:8080/v1/policy/agent-hostname-12345
```

---

### SIEM Webhook Configuration

```http
POST /v1/siem/register
```

Register SIEM webhook endpoint for receiving OCSF-formatted events.

**Request Body**:
```json
{
  "name": "XSIAM Production",
  "webhook_url": "https://xsiam.example.com/api/ingest",
  "format": "ocsf",
  "auth": {
    "type": "bearer",
    "token": "siem_api_token"
  },
  "filters": {
    "min_severity": "medium",
    "event_types": ["package_install", "ai_tool_call"]
  }
}
```

**Response** (201 Created):
```json
{
  "webhook_id": "uuid",
  "status": "active"
}
```

**Example**:
```bash
curl -X POST http://localhost:8080/v1/siem/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Splunk",
    "webhook_url": "https://splunk.company.com/services/collector",
    "format": "ocsf",
    "auth": {"type": "bearer", "token": "HEC_TOKEN"}
  }'
```

---

## Authentication

### Agent Authentication (mTLS)

**For production deployments**:

1. Agent presents client certificate during TLS handshake
2. Cloud API verifies certificate against CA
3. Certificate CN/SAN contains agent ID
4. Requests tied to authenticated agent identity

**Configuration** (agent):
```bash
runtime-ai-agent \
  --cloud-endpoint=https://api.company.com \
  --tls-cert=/etc/runtime-ai/agent.crt \
  --tls-key=/etc/runtime-ai/agent.key \
  --tls-ca=/etc/runtime-ai/ca.crt
```

**Configuration** (cloud):
```bash
cloud-api \
  --tls-cert=/etc/runtime-ai/server.crt \
  --tls-key=/etc/runtime-ai/server.key \
  --tls-client-ca=/etc/runtime-ai/ca.crt \
  --tls-client-auth=require
```

### SIEM Webhook Authentication

**Supported methods**:
- Bearer token (recommended)
- API key (header or query param)
- mTLS (for high-security environments)

---

## Rate Limiting

**Agent Event Submission**:
- 1000 events per 10 seconds per agent
- Burst allowance: 200 events
- Exceeding limit: HTTP 429 (retry after 10s)

**Policy Requests**:
- 10 requests per minute per agent
- Policies cached for 1 hour

**SIEM Webhooks**:
- 100 events per second per webhook
- Batched in groups of 50

---

## Error Responses

### 400 Bad Request

Invalid request format or missing required fields.

```json
{
  "error": "invalid_request",
  "message": "Missing required field: agent_id",
  "details": {
    "field": "agent_id",
    "expected": "string"
  }
}
```

### 401 Unauthorized

Invalid or missing authentication credentials.

```json
{
  "error": "unauthorized",
  "message": "Invalid client certificate"
}
```

### 429 Too Many Requests

Rate limit exceeded.

```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests",
  "retry_after": 10
}
```

### 500 Internal Server Error

Server-side error (database, processing failure).

```json
{
  "error": "internal_error",
  "message": "Failed to process events",
  "request_id": "uuid"
}
```

---

## Event Schema Reference

See detailed schemas: [docs/SCHEMAS.md](SCHEMAS.md)

**Common Fields** (all events):
- `version` (string): Schema version ("1.0")
- `event_id` (string): Unique event identifier (UUID)
- `event_type` (string): Type of event
- `timestamp` (string): ISO 8601 timestamp (UTC)
- `agent_id` (string): Agent identifier
- `agent_version` (string): Agent version
- `device` (object): Device metadata
- `data` (object): Event-specific data
- `verdict` (object): Detection verdict

---

## Webhook Payload Format

### OCSF Format (default)

```json
{
  "activity_id": 1,
  "category_uid": 3,
  "class_uid": 3003,
  "severity_id": 4,
  "time": 1711833600000,
  "type_uid": 300301,
  "actor": {
    "user": {
      "name": "developer",
      "uid": "501"
    }
  },
  "metadata": {
    "product": {
      "name": "Runtime AI Security Agent",
      "vendor_name": "Your Org",
      "version": "0.1.0"
    }
  },
  "package": {
    "name": "requsets",
    "version": "2.31.0"
  },
  "disposition_id": 2,
  "message": "Malicious package blocked: typosquat of requests"
}
```

See examples: [docs/OCSF-EXAMPLES.md](OCSF-EXAMPLES.md)

---

## Integration Examples

### Splunk Integration

```bash
# Configure Splunk HEC
curl -X POST http://localhost:8080/v1/siem/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Splunk HEC",
    "webhook_url": "https://splunk:8088/services/collector",
    "format": "ocsf",
    "auth": {
      "type": "bearer",
      "token": "'"$SPLUNK_HEC_TOKEN"'"
    }
  }'
```

### XSIAM Integration

```bash
curl -X POST http://localhost:8080/v1/siem/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "XSIAM",
    "webhook_url": "https://api-your-tenant.xdr.us.paloaltonetworks.com/public_api/v1/insert/events",
    "format": "ocsf",
    "auth": {
      "type": "api_key",
      "header": "x-xdr-auth-id",
      "token": "'"$XSIAM_API_KEY"'"
    }
  }'
```

### Wiz Integration

```bash
curl -X POST http://localhost:8080/v1/siem/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wiz Security Graph",
    "webhook_url": "https://api.wiz.io/graphql",
    "format": "ocsf",
    "auth": {
      "type": "bearer",
      "token": "'"$WIZ_API_TOKEN"'"
    }
  }'
```

---

## Testing API

### Mock Cloud Server

For local testing without full stack:

```bash
# Start mock server
./dist/mock-cloud

# Test health
curl http://localhost:8080/health

# Submit test event
curl -X POST http://localhost:8080/v1/events \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"test","events":[...]}'
```

### Integration Test Script

```bash
# Automated testing
./test/integration-test.sh

# Runs:
# - Health check
# - Event submission (benign, malicious, AI)
# - Policy retrieval
# - Verifies responses
```

---

## API Versioning

**Current**: v1 (paths prefixed with `/v1/`)

**Version Policy**:
- Backward compatibility maintained within major version
- Breaking changes require new major version (`/v2/`)
- Deprecation notices given 90 days before removal

**Migration Path** (when v2 is released):
- v1 and v2 run in parallel
- Agents auto-upgrade to latest compatible version
- Old agents continue on v1 until explicit upgrade

---

## Performance

**Typical Response Times** (p95):
- Health check: <10ms
- Event submission: <50ms
- Policy retrieval: <100ms (includes signature verification)

**Throughput**:
- Events/second: 10,000+ (single instance)
- Concurrent agents: 5,000+ (single instance)

**Scaling**:
- Horizontal: Add API instances behind load balancer
- Database: PostgreSQL read replicas
- Caching: Redis for policy bundles

---

*Last updated: 2026-03-30*  
*Auto-generated sections updated by documentation-expert skill*
