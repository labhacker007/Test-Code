# Sample Events

## Package Install Event (npm - benign)

```json
{
  "version": "1.0",
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_type": "package_install",
  "timestamp": "2026-03-30T16:45:23.123Z",
  "agent_id": "agent-mac-dev-001",
  "agent_version": "0.1.0",
  "device": {
    "hostname": "dev-macbook.local",
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
    "hash": {
      "algorithm": "sha256",
      "value": "f6b9b3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3"
    },
    "install_script": {
      "present": false
    }
  },
  "verdict": {
    "decision": "allow",
    "confidence": 1.0,
    "reason": "Package in allowlist",
    "rule_id": "ALLOWLIST_NPM_POPULAR"
  }
}
```

## Package Install Event (pip - suspicious)

```json
{
  "version": "1.0",
  "event_id": "660e8400-e29b-41d4-a716-446655440001",
  "event_type": "package_install",
  "timestamp": "2026-03-30T16:50:12.456Z",
  "agent_id": "agent-linux-ci-042",
  "agent_version": "0.1.0",
  "device": {
    "hostname": "ci-runner-42",
    "os": "linux",
    "os_version": "6.8.0",
    "arch": "amd64",
    "user": "jenkins"
  },
  "data": {
    "ecosystem": "pip",
    "package_name": "requsets",
    "version": "2.31.0",
    "registry": "https://pypi.org",
    "hash": {
      "algorithm": "sha256",
      "value": "abc123..."
    },
    "install_script": {
      "present": true,
      "hash": "def456...",
      "suspicious_patterns": [
        "curl",
        "base64",
        "eval"
      ]
    }
  },
  "verdict": {
    "decision": "uncertain",
    "confidence": 0.3,
    "reason": "Typosquat candidate (requests) + suspicious install script",
    "rule_id": "TYPOSQUAT_DETECTOR"
  }
}
```

## AI Tool Call Event (MCP - file write)

```json
{
  "version": "1.0",
  "event_id": "770e8400-e29b-41d4-a716-446655440002",
  "event_type": "ai_tool_call",
  "timestamp": "2026-03-30T17:05:45.789Z",
  "agent_id": "agent-mac-dev-001",
  "agent_version": "0.1.0",
  "device": {
    "hostname": "dev-macbook.local",
    "os": "darwin",
    "os_version": "25.4.0",
    "arch": "arm64",
    "user": "developer"
  },
  "data": {
    "client": "cursor",
    "tool_name": "write_file",
    "args": {
      "path": "/tmp/output.txt",
      "size_bytes": 1024
    },
    "context_hash": "sha256:9f86d081884c7d659a2feaa0c55ad015..."
  },
  "verdict": {
    "decision": "allow",
    "confidence": 1.0,
    "reason": "Standard file write to non-sensitive path",
    "rule_id": "AI_TOOL_SAFE_PATHS"
  }
}
```

## File Access Event (credential theft attempt)

```json
{
  "version": "1.0",
  "event_id": "880e8400-e29b-41d4-a716-446655440003",
  "event_type": "file_access",
  "timestamp": "2026-03-30T17:10:33.234Z",
  "agent_id": "agent-mac-dev-001",
  "agent_version": "0.1.0",
  "device": {
    "hostname": "dev-macbook.local",
    "os": "darwin",
    "os_version": "25.4.0",
    "arch": "arm64",
    "user": "developer"
  },
  "data": {
    "path": "/Users/developer/.ssh/id_rsa",
    "operation": "read",
    "process": "node",
    "is_sensitive": true
  },
  "verdict": {
    "decision": "deny",
    "confidence": 0.95,
    "reason": "Unauthorized access to SSH private key by npm package process",
    "rule_id": "CREDENTIAL_ACCESS_BLOCK"
  }
}
```

## Extension Install Event (unknown extension)

```json
{
  "version": "1.0",
  "event_id": "990e8400-e29b-41d4-a716-446655440004",
  "event_type": "extension_install",
  "timestamp": "2026-03-30T17:15:22.567Z",
  "agent_id": "agent-mac-dev-001",
  "agent_version": "0.1.0",
  "device": {
    "hostname": "dev-macbook.local",
    "os": "darwin",
    "os_version": "25.4.0",
    "arch": "arm64",
    "user": "developer"
  },
  "data": {
    "ide": "vscode",
    "extension_id": "unknown-publisher.solidity-macos",
    "version": "0.1.8",
    "publisher": "unknown-publisher",
    "marketplace": "openvsx",
    "permissions": [
      "workspace.executeCommand",
      "network",
      "filesystem"
    ],
    "activation_events": [
      "*"
    ]
  },
  "verdict": {
    "decision": "uncertain",
    "confidence": 0.4,
    "reason": "Unknown publisher + broad activation events + network permission",
    "rule_id": "EXTENSION_RISK_SCORE"
  }
}
```
