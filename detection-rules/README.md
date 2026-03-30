# Detection Rules Reference

This document describes the detection rules for the Runtime AI Security Agent.

## Rule Categories

### 1. Supply Chain / Typosquatting

| Rule ID | Severity | Description | MITRE ATT&CK |
|---------|----------|-------------|--------------|
| `TYPOSQUAT_NPM_REACT` | High | Detects typosquatting attempts against React (reac, reactt, raect) | T1195.002 |
| `TYPOSQUAT_PIP_REQUESTS` | High | Detects typosquatting attempts against requests (requ, requsets) | T1195.002 |

**Pattern:** Single-character edits, common prefixes/suffixes, keyboard adjacency.

**References:**
- MALGUARD (USENIX Security 2025): [arxiv.org/pdf/2506.14466](https://arxiv.org/pdf/2506.14466)
- TeamPCP supply chain campaign analysis

### 2. Credential Access

| Rule ID | Severity | Description | MITRE ATT&CK |
|---------|----------|-------------|--------------|
| `INSTALL_SCRIPT_SSH_ACCESS` | Critical | Install script accesses `.ssh/` directory | T1552.004 |
| `INSTALL_SCRIPT_AWS_CREDS` | Critical | Install script accesses `.aws/` credentials | T1552.001 |
| `INSTALL_SCRIPT_TOKEN_ACCESS` | Critical | Install script reads GitHub tokens | T1552.001 |
| `FILE_ACCESS_SSH_KEY` | Critical | Unauthorized read of SSH private keys | T1552.004 |

**Pattern:** File access to known credential paths during package install or unexpected process context.

### 3. Code Obfuscation

| Rule ID | Severity | Description | MITRE ATT&CK |
|---------|----------|-------------|--------------|
| `INSTALL_SCRIPT_CURL_EVAL` | Critical | Combines network download with dynamic execution | T1059.004, T1027 |
| `OBFUSCATION_BASE64_HEAVY` | High | Excessive base64 encoding indicating obfuscation | T1027 |

**Pattern:** Multi-stage obfuscation, base64 + eval combinations, invisible Unicode.

**References:**
- GlassWorm campaign (invisible Unicode obfuscation)
- LiteLLM attack (three-layer base64 encoding)

### 4. IDE Extension Risks

| Rule ID | Severity | Description | MITRE ATT&CK |
|---------|----------|-------------|--------------|
| `EXTENSION_WILDCARD_ACTIVATION` | Medium | Extension uses `*` activation (runs on all IDE events) | T1176 |
| `EXTENSION_SIDELOAD` | Medium | Extension installed outside official marketplace | T1195.002 |
| `EXTENSION_NETWORK_FILESYSTEM` | Medium | Combination of network + filesystem permissions | T1005, T1041 |

**Pattern:** Excessive permissions, broad activation, unknown publishers.

**References:**
- [Extension Guard](https://github.com/astroicers/extension-guard) detection patterns
- Windsurf Solana C2 attack

### 5. AI Tool Abuse

| Rule ID | Severity | Description | MITRE ATT&CK |
|---------|----------|-------------|--------------|
| `AI_TOOL_SHELL_EXEC` | High | AI agent attempting shell command execution | T1059 |

**Pattern:** Tool calls to shell/exec primitives; future: prompt injection signatures.

**References:**
- [OWASP LLM Top 10 (2025)](https://genai.owasp.org/)
- Upwind prompt injection detection research

### 6. Network Exfiltration

| Rule ID | Severity | Description | MITRE ATT&CK |
|---------|----------|-------------|--------------|
| `NETWORK_PASTEBIN` | High | Connection to pastebin services from package/extension | T1041 |
| `BLOCKCHAIN_C2` | Critical | Connection to blockchain RPC (potential C2 channel) | T1071.001 |

**Pattern:** Unexpected network destinations for package install or IDE extension context.

**References:**
- Windsurf blockchain C2 technique

### 7. Destructive Actions

| Rule ID | Severity | Description | MITRE ATT&CK |
|---------|----------|-------------|--------------|
| `DESTRUCTIVE_COMMAND` | High | Install script contains `rm -rf` or similar | T1485 |

---

## Rule Development Guidelines

### When to add a new rule

- **High-confidence signature** (low false positive): add as `deny` action.
- **Behavioral anomaly** (needs tuning): add as `alert` action.
- **Broad pattern** (many legitimate hits): add as `escalate` (send to LLM tier).

### Testing rules

1. Create test fixtures in `detection-rules/fixtures/`.
2. Run against historical benign + malicious corpus.
3. Measure FP rate; target <0.1% for `deny` rules, <5% for `alert`.

### Rule versioning

Policy bundles are versioned; rules can be:
- **Added** (new rule_id).
- **Disabled** (`enabled: false`).
- **Never removed** from schema (for audit trail).

---

## Future Rules (roadmap)

- **Semantic prompt injection** (requires LLM; Phase 2)
- **Dependency confusion** (internal package name overlap)
- **Maintainer takeover** (legitimate package, new malicious version)
- **Homograph attacks** (Unicode lookalikes)
- **MCP tool poisoning** (tool definition manipulation)

---

## References

- [OWASP LLM Top 10 (2025)](https://genai.owasp.org/)
- [MITRE ATT&CK for Enterprise](https://attack.mitre.org/)
- MALGUARD paper: [arxiv.org/pdf/2506.14466](https://arxiv.org/pdf/2506.14466)
- GlassWorm campaign: [bleepingcomputer.com](https://www.bleepingcomputer.com/news/security/glassworm-malware-hits-400-plus-code-repos-on-github-npm-vscode-openvsx/)
