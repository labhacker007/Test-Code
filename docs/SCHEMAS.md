# Data Schemas Reference

**Version**: 1.0  
**Last Updated**: 2026-03-30

---

## Event Schema

All events share a common base structure with event-specific `data` fields.

### Base Event Structure

```json
{
  "version": "1.0",
  "event_id": "string (UUID)",
  "event_type": "string (enum)",
  "timestamp": "string (ISO 8601)",
  "agent_id": "string",
  "agent_version": "string",
  "device": {
    "hostname": "string",
    "os": "string",
    "os_version": "string",
    "arch": "string",
    "user": "string"
  },
  "data": {
    /* Event-specific fields */
  },
  "verdict": {
    "decision": "string (allow|deny|alert)",
    "confidence": "number (0.0-1.0)",
    "reason": "string",
    "rule_id": "string (optional)"
  }
}
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | ✅ | Schema version (currently "1.0") |
| `event_id` | string | ✅ | Unique event identifier (UUID v4) |
| `event_type` | string | ✅ | Type of event (see Event Types below) |
| `timestamp` | string | ✅ | Event timestamp in UTC (RFC 3339) |
| `agent_id` | string | ✅ | Agent instance identifier |
| `agent_version` | string | ✅ | Agent software version (semver) |
| `device` | object | ✅ | Device metadata |
| `data` | object | ✅ | Event-specific data |
| `verdict` | object | ✅ | Detection verdict |

---

## Event Types

### 1. Package Install Event

**Type**: `package_install`

**Data Fields**:
```json
{
  "ecosystem": "npm|pip|gem|cargo|go",
  "package_name": "string",
  "version": "string",
  "registry": "string (URL)",
  "install_script": {
    "present": "boolean",
    "hash": "string (SHA256, if present)",
    "size": "number (bytes, if present)",
    "suspicious_patterns": ["string array (if detected)"]
  }
}
```

**Example**:
```json
{
  "event_type": "package_install",
  "data": {
    "ecosystem": "pip",
    "package_name": "requests",
    "version": "2.31.0",
    "registry": "https://pypi.org",
    "install_script": {
      "present": true,
      "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "size": 2048,
      "suspicious_patterns": []
    }
  }
}
```

---

### 2. Extension Install Event

**Type**: `extension_install`

**Data Fields**:
```json
{
  "ide": "vscode|cursor|windsurf",
  "extension_id": "string",
  "version": "string",
  "publisher": "string",
  "permissions": ["string array"],
  "marketplace": "string (URL)"
}
```

**Example**:
```json
{
  "event_type": "extension_install",
  "data": {
    "ide": "cursor",
    "extension_id": "example.copilot",
    "version": "1.2.3",
    "publisher": "example",
    "permissions": ["network", "filesystem"],
    "marketplace": "https://marketplace.visualstudio.com"
  }
}
```

---

### 3. AI Tool Call Event

**Type**: `ai_tool_call`

**Data Fields**:
```json
{
  "client": "cursor|copilot|claude-desktop",
  "tool_name": "string",
  "args": {
    /* Tool-specific arguments (sanitized) */
  },
  "context_hash": "string (SHA256)"
}
```

**Example**:
```json
{
  "event_type": "ai_tool_call",
  "data": {
    "client": "cursor",
    "tool_name": "shell_exec",
    "args": {
      "command": "ls -la /home/user"
    },
    "context_hash": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
  }
}
```

---

### 4. Agent Heartbeat Event

**Type**: `agent_heartbeat`

**Data Fields**:
```json
{
  "uptime_seconds": "number",
  "policy_version": "string",
  "events_queued": "number",
  "memory_mb": "number",
  "cpu_percent": "number"
}
```

---

## Policy Schema

Policy bundles define detection rules, allowlists, and denylists.

### Policy Structure

```json
{
  "version": "1.0",
  "policy_id": "string",
  "issued_at": "string (ISO 8601)",
  "expires_at": "string (ISO 8601)",
  "mode": "permissive|blocking|monitor",
  "signature": "string (Ed25519 base64)",
  "rules": [
    {
      "id": "string",
      "type": "pattern_match|fuzzy_match|heuristic",
      "severity": "critical|high|medium|low",
      "enabled": "boolean",
      "pattern": {
        "field": "string (JSON path)",
        "operator": "equals|contains|regex|fuzzy_match",
        "value": "string",
        "threshold": "number (0.0-1.0, for fuzzy)"
      },
      "action": "allow|deny|alert"
    }
  ],
  "allowlist": {
    "packages": [
      {"ecosystem": "string", "name": "string"}
    ],
    "hashes": ["string (SHA256)"],
    "domains": ["string (domain)"]
  },
  "denylist": {
    "packages": [
      {"ecosystem": "string", "name": "string"}
    ],
    "hashes": ["string (SHA256)"],
    "domains": ["string (domain)"]
  }
}
```

### Policy Modes

| Mode | Behavior |
|------|----------|
| `permissive` | Alert on deny verdicts, but allow install |
| `blocking` | Block installs with deny verdicts |
| `monitor` | Log all events, never block |

### Rule Types

| Type | Description | Use Case |
|------|-------------|----------|
| `pattern_match` | Exact field matching | Known-bad packages |
| `fuzzy_match` | Similarity-based matching | Typosquatting detection |
| `heuristic` | Complex logic evaluation | Install script analysis |

### Rule Pattern Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Exact match | `package_name == "malicious-pkg"` |
| `contains` | Substring match | `install_script contains "curl \| bash"` |
| `regex` | Regular expression | `package_name =~ "^react[^t]"` |
| `fuzzy_match` | Edit distance | `similarity("requsets", "requests") > 0.8` |

---

## OCSF Export Schema

Events are transformed to OCSF 1.8.0 format for SIEM integration.

### Package Install → OCSF

**OCSF Class**: 3003 (File System Activity)  
**Category**: 3 (System Activity)

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
    },
    "process": {
      "name": "npm",
      "pid": 12345
    }
  },
  "metadata": {
    "product": {
      "name": "Runtime AI Security Agent",
      "vendor_name": "Your Org",
      "version": "0.1.0"
    },
    "version": "1.8.0"
  },
  "file": {
    "name": "package.json",
    "path": "/path/to/project"
  },
  "disposition_id": 2,
  "message": "Malicious package blocked: typosquat detected"
}
```

**Disposition IDs**:
- `1` - Allowed
- `2` - Blocked
- `3` - Quarantined
- `99` - Other (alert)

See more examples: [docs/OCSF-EXAMPLES.md](OCSF-EXAMPLES.md)

---

## Version History

### Schema Version 1.0 (Current)

**Released**: 2026-03-30

**Changes**: Initial schema definition

**Breaking Changes**: None (initial version)

### Future Schema Version 2.0 (Planned)

**Planned Changes**:
- Add LLM analysis fields to verdict
- Add execution context for AI tool calls
- Extend device metadata with network info

**Migration**: Agents will auto-upgrade when policy includes schema version update

---

## Validation

### JSON Schema Files

Full JSON Schema definitions available:

- `agent/pkg/events/schema.json` - Event schema
- `agent/pkg/events/policy-schema.json` - Policy schema

**Validate events**:
```bash
# Using ajv-cli
ajv validate -s agent/pkg/events/schema.json -d test/fixtures/event.json
```

**Validate policies**:
```bash
ajv validate -s agent/pkg/events/policy-schema.json -d rules/default-policy.json
```

---

## Examples Directory

### Sample Files

```
test/fixtures/
├── events/
│   ├── package-install-benign.json
│   ├── package-install-malicious.json
│   ├── extension-install.json
│   ├── ai-tool-call-shell.json
│   └── agent-heartbeat.json
│
├── policies/
│   ├── permissive-policy.json
│   ├── blocking-policy.json
│   └── monitor-only-policy.json
│
└── ocsf/
    ├── package-blocked.json
    ├── ai-tool-alert.json
    └── extension-allowed.json
```

---

*Last updated: 2026-03-30*  
*Schema version: 1.0*  
*Auto-maintained by documentation-expert skill*
