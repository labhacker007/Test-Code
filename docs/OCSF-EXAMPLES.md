# OCSF Event Examples for SIEM Integration

These are sample OCSF 1.8.0 formatted events that the Runtime AI Security Platform exports to XSIAM, Wiz, and other SIEMs.

## Event 1: Malicious Package Detected (Detection Finding)

```json
{
  "activity_id": 1,
  "activity_name": "Create",
  "category_uid": 2,
  "category_name": "Findings",
  "class_uid": 2004,
  "class_name": "Detection Finding",
  "severity_id": 4,
  "severity": "High",
  "message": "Malicious package detected and blocked: pip/requsets@2.31.0 (typosquat of requests)",
  "metadata": {
    "product": {
      "name": "Runtime AI Security Platform",
      "version": "0.1.0",
      "vendor_name": "labhacker007"
    },
    "version": "1.8.0",
    "original_time": "2026-03-30T17:23:45.123Z",
    "processed_time": "2026-03-30T17:23:45.567Z",
    "correlation_uid": "incident-2026-03-30-001"
  },
  "time": 1711821825,
  "type_uid": 200401,
  "finding": {
    "title": "Typosquatting Attack Detected",
    "uid": "finding-550e8400-e29b-41d4-a716-446655440001",
    "types": ["Supply Chain Compromise"],
    "src_url": "https://pypi.org/project/requsets/"
  },
  "observables": [
    {
      "name": "Package Name",
      "type_id": 26,
      "value": "requsets"
    },
    {
      "name": "Package Hash",
      "type_id": 13,
      "value": "abc123def456..."
    }
  ],
  "actor": {
    "user": {
      "name": "jenkins",
      "uid": "1001"
    }
  },
  "device": {
    "hostname": "ci-runner-42",
    "os": "Linux",
    "type": "server",
    "uid": "agent-linux-ci-042"
  },
  "raw_data": {
    "rule_id": "TYPOSQUAT_PIP_REQUESTS",
    "confidence": 0.85,
    "ecosystem": "pip",
    "legitimate_package": "requests"
  }
}
```

## Event 2: Package Install (API Activity)

```json
{
  "activity_id": 1,
  "activity_name": "Create",
  "category_uid": 6,
  "category_name": "Application Activity",
  "class_uid": 6003,
  "class_name": "API Activity",
  "severity_id": 1,
  "severity": "Informational",
  "message": "Package install: npm/lodash@4.17.21",
  "metadata": {
    "product": {
      "name": "Runtime AI Security Platform",
      "version": "0.1.0",
      "vendor_name": "labhacker007"
    },
    "version": "1.8.0",
    "original_time": "2026-03-30T16:45:23.123Z",
    "processed_time": "2026-03-30T16:45:23.234Z"
  },
  "time": 1711818323,
  "type_uid": 600301,
  "api": {
    "operation": "install",
    "service": {
      "name": "npm"
    },
    "request": {
      "uid": "event-550e8400-e29b-41d4-a716-446655440000"
    }
  },
  "observables": [
    {
      "name": "Package Hash",
      "type_id": 13,
      "value": "f6b9b3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3"
    }
  ],
  "actor": {
    "user": {
      "name": "developer",
      "uid": "501"
    }
  },
  "device": {
    "hostname": "dev-macbook.local",
    "os": "macOS",
    "type": "laptop",
    "uid": "agent-mac-dev-001"
  },
  "raw_data": {
    "ecosystem": "npm",
    "package_name": "lodash",
    "version": "4.17.21",
    "registry": "https://registry.npmjs.org",
    "verdict": "allow"
  }
}
```

## Event 3: Credential Access (File System Activity)

```json
{
  "activity_id": 2,
  "activity_name": "Read",
  "category_uid": 4,
  "category_name": "System Activity",
  "class_uid": 4001,
  "class_name": "File System Activity",
  "severity_id": 5,
  "severity": "Critical",
  "message": "Unauthorized SSH private key access: /Users/developer/.ssh/id_rsa",
  "metadata": {
    "product": {
      "name": "Runtime AI Security Platform",
      "version": "0.1.0",
      "vendor_name": "labhacker007"
    },
    "version": "1.8.0",
    "original_time": "2026-03-30T17:10:33.234Z",
    "processed_time": "2026-03-30T17:10:33.456Z"
  },
  "time": 1711822233,
  "type_uid": 400102,
  "file": {
    "path": "/Users/developer/.ssh/id_rsa",
    "type": "Regular File",
    "confidentiality": "Secret"
  },
  "observables": [
    {
      "name": "File Path",
      "type_id": 7,
      "value": "/Users/developer/.ssh/id_rsa"
    }
  ],
  "actor": {
    "process": {
      "name": "node",
      "pid": 12345
    },
    "user": {
      "name": "developer",
      "uid": "501"
    }
  },
  "device": {
    "hostname": "dev-macbook.local",
    "os": "macOS",
    "type": "laptop",
    "uid": "agent-mac-dev-001"
  },
  "raw_data": {
    "rule_id": "CREDENTIAL_ACCESS_BLOCK",
    "verdict": "deny",
    "confidence": 0.95,
    "mitre_attack": ["T1552.004"]
  }
}
```

## Event 4: AI Tool Call (API Activity)

```json
{
  "activity_id": 2,
  "activity_name": "Execute",
  "category_uid": 6,
  "category_name": "Application Activity",
  "class_uid": 6003,
  "class_name": "API Activity",
  "severity_id": 3,
  "severity": "Medium",
  "message": "AI tool call: cursor/shell_exec",
  "metadata": {
    "product": {
      "name": "Runtime AI Security Platform",
      "version": "0.1.0",
      "vendor_name": "labhacker007"
    },
    "version": "1.8.0",
    "original_time": "2026-03-30T17:05:45.789Z",
    "processed_time": "2026-03-30T17:05:46.012Z"
  },
  "time": 1711821945,
  "type_uid": 600302,
  "api": {
    "operation": "shell_exec",
    "service": {
      "name": "cursor-mcp"
    }
  },
  "actor": {
    "user": {
      "name": "developer",
      "uid": "501"
    },
    "process": {
      "name": "Cursor"
    }
  },
  "device": {
    "hostname": "dev-macbook.local",
    "os": "macOS",
    "type": "laptop",
    "uid": "agent-mac-dev-001"
  },
  "raw_data": {
    "client": "cursor",
    "tool_name": "shell_exec",
    "rule_id": "AI_TOOL_SHELL_EXEC",
    "verdict": "alert"
  }
}
```

## Event 5: Extension Install (Application Activity)

```json
{
  "activity_id": 1,
  "activity_name": "Install",
  "category_uid": 6,
  "category_name": "Application Activity",
  "class_uid": 6001,
  "class_name": "Application Activity",
  "severity_id": 3,
  "severity": "Medium",
  "message": "Extension install: vscode/unknown-publisher.solidity-macos@0.1.8",
  "metadata": {
    "product": {
      "name": "Runtime AI Security Platform",
      "version": "0.1.0",
      "vendor_name": "labhacker007"
    },
    "version": "1.8.0",
    "original_time": "2026-03-30T17:15:22.567Z",
    "processed_time": "2026-03-30T17:15:22.789Z"
  },
  "time": 1711822522,
  "type_uid": 600101,
  "actor": {
    "user": {
      "name": "developer",
      "uid": "501"
    }
  },
  "device": {
    "hostname": "dev-macbook.local",
    "os": "macOS",
    "type": "laptop",
    "uid": "agent-mac-dev-001"
  },
  "raw_data": {
    "ide": "vscode",
    "extension_id": "unknown-publisher.solidity-macos",
    "version": "0.1.8",
    "marketplace": "openvsx",
    "permissions": ["workspace.executeCommand", "network", "filesystem"],
    "activation_events": ["*"],
    "rule_id": "EXTENSION_RISK_SCORE",
    "verdict": "uncertain"
  }
}
```

## OCSF Field Mappings

### Common Fields

| Our Event Field | OCSF Field | Notes |
|-----------------|------------|-------|
| `agent_id` | `device.uid` | Unique agent identifier |
| `timestamp` | `time` (Unix epoch) | Event occurrence time |
| `event_type` | `class_uid` | Mapped to OCSF class |
| `verdict.decision` | `severity_id` | deny=4/5, uncertain=3, allow=1 |

### Event Type → OCSF Class Mapping

| Our Type | OCSF Category | OCSF Class | class_uid |
|----------|---------------|------------|-----------|
| `package_install` | Application Activity | API Activity | 6003 |
| `extension_install` | Application Activity | Application Activity | 6001 |
| `ai_tool_call` | Application Activity | API Activity | 6003 |
| `file_access` | System Activity | File System Activity | 4001 |
| `network_connection` | Network Activity | Network Activity | 4001 |
| Verdicts (deny) | Findings | Detection Finding | 2004 |

### Severity Mapping

| Our Verdict | OCSF severity_id | OCSF Severity |
|-------------|------------------|---------------|
| deny (critical rule) | 5 | Critical |
| deny (high rule) | 4 | High |
| uncertain | 3 | Medium |
| alert | 2 | Low |
| allow | 1 | Informational |

## Integration Examples

### Push to XSIAM

```bash
curl -X POST \
  https://api-your-tenant.xdr.us.paloaltonetworks.com/logs/v1/event \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @ocsf-event.json
```

### Push to Wiz

```bash
curl -X POST \
  https://webhook.wiz.io/your-tenant \
  -H "Content-Type: application/json" \
  -d @ocsf-event.json
```

### Pull from Our API

```bash
curl -X GET \
  "https://your-cloud-api.example.com/integration/ocsf/events?since=2026-03-30T00:00:00Z&limit=1000" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

## References

- [OCSF Schema Documentation](https://schema.ocsf.io/1.8.0/)
- [OCSF GitHub Repository](https://github.com/ocsf/ocsf-schema)
- [Cribl XSIAM Destination Docs](https://docs.cribl.io/stream/destinations-xsiam)
