# Runtime AI Security Agent: Architecture Design

**Version:** 0.1  
**Date:** 2026-03-30  
**Status:** Design  

---

## Executive summary

This document defines a **lightweight endpoint agent** for **detection, prevention, and monitoring** of **IDE, AI tooling, packages, and runtime AI attacks**, with **real-time telemetry** to a cloud control plane and **integrations** to enterprise security platforms (XSIAM, Wiz, etc.).

**Design goals:**
1. **Lightweight install** (single binary, <50MB, <100MB RAM baseline).
2. **Real-time prevention** (block before execution) + **detection** (behavior anomaly).
3. **Enterprise integration** (OCSF/CEF event formats, webhook/API to SIEM/CNAPP).
4. **Policy + rules + AI hybrid** (local fast-path, cloud-assisted semantic).

---

## Threat model

### Assets

| Asset | Why critical |
|-------|--------------|
| Developer credentials (SSH, tokens, cloud keys) | High-value for lateral movement; stored in plaintext on many endpoints |
| Source code | IP theft, backdoor injection |
| IDE / AI tooling trust | Supply-chain entry point (extensions, MCP servers, packages) |
| Runtime AI tool calls | Agent access to file, shell, network — abuse = full endpoint compromise |

### Adversaries

- **External threat actors**: supply-chain compromise (typosquatting, maintainer takeover), phishing for creds.
- **Insider misuse**: exfiltration via "innocent" dev tools, unapproved data processing.

### Attack vectors (in scope)

1. **Malicious packages** — npm/pip install scripts, obfuscated post-install, typosquatting.
2. **IDE extensions** — backdoored VSCode/Cursor/Windsurf extensions (e.g., GlassWorm, Solana-C2 campaigns).
3. **AI prompt/tool injection** — indirect prompt injection via files/URLs, tool poisoning (unauthorized `exec`, `write`, `network`).
4. **Credential theft** — reading SSH keys, env vars, token files.

### Mitigations (architecture-level)

- **Prevention hooks**: interpose before package install, extension activate, AI tool execute.
- **Detection**: behavioral anomaly (unexpected network, file access patterns), signature (known-bad hashes, domains).
- **Least privilege**: agent itself runs as user (not root) where OS permits; policy enforced before escalation.

---

## Component architecture

```
┌─────────────────────────────────────────────────────────────┐
│  ENDPOINT (Developer Machine)                               │
│                                                             │
│  ┌──────────────────┐       ┌─────────────────────────┐   │
│  │  IDE / AI Tools  │───1──>│  Lightweight Agent      │   │
│  │  (VS Code,       │       │  (single binary)        │   │
│  │   Cursor, etc.)  │       │                         │   │
│  └──────────────────┘       │  • Hooks (RITM, FS      │   │
│         │                   │    watch, shim)         │   │
│  ┌──────▼──────────┐        │  • Local policy cache   │   │
│  │  Package Mgrs   │───2──>│  • Fast rule engine     │   │
│  │  (npm, pip)     │        │  • Event buffer (queue) │   │
│  └─────────────────┘        │  • TLS client           │   │
│                             └──────────┬──────────────┘   │
│                                        │ 3 (TLS)          │
└────────────────────────────────────────┼──────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────┐
│  CLOUD CONTROL PLANE                                       │
│                                                            │
│  ┌───────────────────┐      ┌──────────────────────────┐ │
│  │  Event Ingestion  │──4──>│  Policy / Rule / Model   │ │
│  │  (API gateway +   │      │  Distribution            │ │
│  │   queue)          │      │  (signed bundles)        │ │
│  └────────┬──────────┘      └──────────────────────────┘ │
│           │ 5                                             │
│           ▼                                               │
│  ┌───────────────────┐                                   │
│  │  Tiered Analysis  │                                   │
│  │  • Rules (fast)   │                                   │
│  │  • Reputation     │                                   │
│  │  • LLM/SLM        │                                   │
│  └────────┬──────────┘                                   │
│           │ 6                                             │
│           ▼                                               │
│  ┌───────────────────┐      ┌──────────────────────────┐ │
│  │  Security DB      │      │  Admin / SOC UI          │ │
│  │  (events, verdicts│<─7───│  (triage, tuning)        │ │
│  │   policies)       │      └──────────────────────────┘ │
│  └────────┬──────────┘                                   │
│           │ 8 (webhook/API)                              │
└───────────┼──────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────┐
│  ENTERPRISE SIEM / CNAPP (XSIAM, Wiz, Splunk, etc.)      │
│  • OCSF / CEF formatted events                            │
│  • Webhook push or API pull                               │
└───────────────────────────────────────────────────────────┘
```

### Flow narrative

1. **IDE / AI tools** (Cursor, Copilot, MCP servers, etc.) → agent **intercepts** tool calls, extension activations.
2. **Package managers** (npm, pip) → agent **shims or wrapper** catches install before execution.
3. **Agent → Cloud**: batched or streaming events via **TLS** (mutual auth recommended).
4. **Cloud ingestion** → message queue (Kafka, SQS, GCP Pub/Sub) for scale.
5. **Tiered analysis**: rules (ms), reputation lookup (10s of ms), LLM/SLM for uncertain cases (hundreds of ms).
6. **Verdict → DB + pushed back to agent** (if block/allow policy update).
7. **Admin UI** for SOC: triage alerts, tune rules, approve/deny pending actions.
8. **SIEM/CNAPP integration**: OCSF-formatted events pushed via webhook or pulled via API.

---

## Agent (endpoint) design

### Binary + install

- **Language:** Go or Rust — cross-platform, single binary, no JVM/Python dependency.
- **Size target:** <50MB binary; <100MB RAM at idle; <200MB under load.
- **Install:** package (`.deb`, `.rpm`, `.pkg` signed) or **official** installer script with hash verification — **never** mutable `curl | sh`.
- **Privilege:** runs as **user** on macOS/Windows; on Linux, optional eBPF requires `CAP_BPF` or root for probe install, then drops.

### Hooks (per OS)

| OS | Package | IDE/FS | Network/Exec |
|----|---------|--------|--------------|
| **macOS** | Shim in `PATH` before brew/npm/pip (transparent wrapper) | FS events API (FSEvents) + optional VS Code ext | (User mode — limited; optional Network Extension for org-managed endpoints) |
| **Linux** | Shim or LD_PRELOAD (lighter); package manager hooks (apt/yum) | inotify + optional eBPF for exec provenance | eBPF for socket, exec, file open (comprehensive but kernel-dependent) |
| **Windows** | Shim or registry hook | File system watcher | (User mode — limited without EDR-level driver; defer or partner) |

**IDE integration (all OS):** optional **sidecar extension** that **reports** to agent when other extensions activate/update. Agent scans extension folder. Reference: [IDE Shepherd](https://github.com/DataDog/IDE-Shepherd-extension) uses **RITM + monkey patching** for runtime JS interception.

### Local intelligence (fast path, <10ms decision)

1. **Hash allowlist/denylist** (pre-computed; signed updates from cloud).
2. **Regex/YARA-style rules** for install scripts, import paths, suspicious domains.
3. **AST features** (MALGUARD-inspired): API centrality, obfuscation signals, entropy.
4. **Permission checks**: excessive IDE extension `activationEvents`, container privileged flags.

If verdict is **ALLOW** or **DENY** with high confidence → act immediately.  
If **UNCERTAIN** → queue for cloud analysis and either:
- **Block pending** (strict mode) or
- **Allow + monitor** (permissive mode, alert after-the-fact).

### Event buffer and transport

- **Local queue** (bounded in-memory or small on-disk ring buffer) for offline resilience.
- **Batch** events every 1–5 seconds or on size threshold (1MB).
- **Protocol:** gRPC or HTTPS POST with **mutual TLS** (agent cert provisioned during install/activation).
- **Retry logic:** exponential backoff; drop oldest on persistent failure (with local log for forensics).

---

## Cloud control plane design

### Event ingestion

- **API gateway** → **message queue** (Kafka, AWS Kinesis, GCP Pub/Sub, Azure Event Hubs).
- **Schema:** [OCSF 1.8+](https://schema.ocsf.io/1.8.0/classes/base_event) for interoperability; internal enrichment pre-queue.
- **Authentication:** agent cert or short-lived token exchange (OIDC-style workload identity).

### Tiered analysis pipeline

| Stage | Latency target | Method | Purpose |
|-------|----------------|--------|---------|
| **1. Rules** | <10ms | Regex, hashes, domain lists | High-confidence allow/deny |
| **2. Reputation** | <50ms | DB lookup (package age, download count, maintainer history) | Risk score adjustment |
| **3. LLM/SLM** | <500ms | Embeddings → lightweight model or API call to larger model | Semantic analysis for uncertain cases (obfuscated code intent, unusual API patterns) |

**Output:** verdict (ALLOW, DENY, INVESTIGATE) + confidence + explanation + references (CVE, report link).

### Policy and rule distribution

- **Signed policy bundles** (JSON + signature; verify with public key baked into agent).
- **Push** via agent poll (every 5–15 min) or **cloud-initiated** via persistent connection (WebSocket/gRPC stream).
- **Version control** for policies; rollback capability.

### Storage

- **Time-series DB** (InfluxDB, TimescaleDB, or managed equivalent) for **events**.
- **Relational DB** (Postgres) for **policies, verdicts, agent inventory**.
- **Object store** (S3-equivalent) for **large artifacts** (full install script for forensics, extension `.vsix` for post-analysis).

### Admin / SOC UI

- **Triage dashboard**: pending approvals, high-severity alerts, agent health.
- **Tuning**: allowlist/denylist management, rule enable/disable, policy version rollout.
- **Forensics**: event timeline per endpoint, correlated with identity (which developer).

---

## Real-time considerations (your key question)

### What "real-time" means in this context

- **Prevention (blocking)**: decision before package installs or AI tool executes → **<100ms** perceived latency acceptable; **<10ms local cache hit** ideal.
- **Detection (alert)**: unusual behavior flagged within **seconds to minutes** of occurrence.
- **Response (remediation)**: policy update propagated to agents in **<5 minutes** (not instant, but fast enough for incident response).

### How to achieve it

#### 1. Local-first decisions (avoid round-trip for common cases)

- **90%+** of packages/tools should match **cached allowlist** (known-good npm/pip packages, official extensions) → **local ALLOW, no cloud call**.
- **Known-bad** hashes → **local DENY**.
- **Only uncertain** items hit cloud.

#### 2. Asynchronous cloud analysis with policy modes

| Mode | Behavior when uncertain | Use case |
|------|-------------------------|----------|
| **Strict** | Block pending cloud verdict | High-security orgs, production |
| **Permissive** | Allow, monitor, alert post-decision | Dev laptops, low-risk |
| **Audit-only** | Allow everything, log all | Pilot phase, baselining |

Most enterprises start **permissive** (minimize dev friction) → tighten to **strict** after tuning.

#### 3. Streaming vs batching tradeoff

- **Prevention events** (block/allow decisions): small payloads, send **individually** or micro-batch (10–50 events).
- **Telemetry** (file access, network connections): batch every **1–5s** to avoid overwhelming network.

#### 4. Persistent connection option (for sub-second policy push)

- Agent opens **gRPC bidirectional stream** or **WebSocket** to cloud.
- Cloud can **push** urgent policy updates (e.g., "block package X immediately after 0-day disclosure").
- Fallback to **polling** every 5 min if connection drops.

#### 5. eBPF for Linux (optional, deeper visibility)

- Capture **exec, open, socket** at kernel level → see **actual behavior** vs declared.
- Example: package claims "no network," but eBPF sees `connect()` to pastebin → **alert**.
- Requires kernel 5.8+; graceful degradation to user-mode on older kernels.

---

## Integration with XSIAM, Wiz, Splunk, etc.

### Standard approach: OCSF event export

**OCSF (Open Cybersecurity Schema Framework)** is an **open standard** for security event format ([schema.ocsf.io](https://schema.ocsf.io/)), backed by AWS, Splunk, and others.

**Event classes to emit:**

| Event class | OCSF class_uid | Example use |
|-------------|----------------|-------------|
| **API Activity** | 6003 | AI tool call (e.g., MCP `write_file` with args), package manager API |
| **Application Activity** | 6001 | Extension install, IDE launch, agent lifecycle |
| **File System Activity** | 4001 | Suspicious file reads (`.ssh/`, `.aws/`) |
| **Network Activity** | 4001 | Unexpected outbound to paste bins, C2 domains |
| **Detection Finding** | 2004 | Verdict: malicious package blocked, prompt injection detected |

**Attributes to include:**
- `agent` object: your agent's UID, version, vendor name.
- `actor`: developer identity (OS user + optional SSO correlation).
- `device`: endpoint hostname, OS, IP (private).
- `observables`: hashes (SHA256 of package, extension), domains, file paths.
- `severity_id`, `status_id`, `confidence`: normalized per OCSF.

### Integration patterns

#### Pattern A: Webhook push (real-time, <5s)

```
Agent Cloud → (batched every 1-5s) → Your event API
                                     │
                                     ▼
                                 Transform to OCSF
                                     │
                                     ▼
                          POST to XSIAM /logs/v1/event
                          or Wiz webhook endpoint
```

**Pros:** near-real-time; SIEM sees events quickly.  
**Cons:** your cloud must handle webhook auth, retries, rate limits from SIEM.

#### Pattern B: Pull via API (batch, minutes)

XSIAM / Wiz / Splunk **polls** your cloud API every 1–15 min.

**Pros:** simpler on your side (no outbound webhook management).  
**Cons:** higher latency for alerts.

#### Pattern C: Hybrid (push critical, pull bulk)

- **High-severity** (confirmed malicious, credential access) → immediate webhook.
- **Bulk telemetry** → batched API pull every 5–15 min.

### XSIAM specifics

- **Endpoint:** `https://<tenant>.xdr.us.paloaltonetworks.com/logs/v1/event`  
- **Auth:** Bearer token (from XSIAM data collector setup).  
- **Format:** JSON array of OCSF events, gzip optional.  
- Ref: [Cribl XSIAM destination docs](https://docs.cribl.io/stream/destinations-xsiam).

### Wiz specifics

- **Webhook ingestion** for **Defend** (runtime) alerts: Wiz provides webhook URL per tenant.  
- **GraphQL API** for bidirectional: your cloud can **query** Wiz for vulnerability context (e.g., "is this container image known-vulnerable in Wiz?") and **push** custom findings.  
- Ref: [Elastic Wiz integration docs](https://www.elastic.co/docs/reference/integrations/wiz).

### Generic SIEM (Splunk, Sentinel, etc.)

- **Syslog/CEF** if org has legacy collectors.
- **HTTP Event Collector (HEC)** for Splunk.
- **Azure Monitor ingestion API** for Sentinel.

---

## Real-time performance budget

### Latency targets (user-facing)

| Action | Acceptable added latency | Mitigation |
|--------|--------------------------|------------|
| `npm install <package>` | <100ms overhead | Local cache hit: 1–5ms; cloud call only if uncertain |
| Extension activate | <50ms | Scan on install (async); activation check is hash lookup |
| AI tool call (file write) | <10ms | Policy eval in-process; cloud verdict cached |

### Throughput (cloud)

- **Ingestion:** 10K–100K events/sec peak (org-wide) → queue-based decoupling.
- **Analysis:** LLM stage is bottleneck; budget **10–50 uncertain items/sec** → scale horizontally or defer non-urgent to batch.

### Agent resource budget (endpoint)

- **Idle:** <50MB RAM, <1% CPU.
- **Active scan** (npm install of 200 packages): burst to 200MB RAM, 10–20% CPU for <10s, then return to idle.

---

## Implementation phases (suggested)

### Phase 1: MVP (block known-bad, log everything)

- **Agent:** shim for npm/pip on macOS/Linux; FS watcher for extensions; local hash denylist.
- **Cloud:** simple API (Flask/FastAPI or Go), Postgres, signed denylist updates.
- **Detection:** hash + regex rules only (no LLM yet).
- **Integration:** OCSF JSON to file or S3; manual import to SIEM for pilot.

**Goal:** prove end-to-end with **<10** dev pilot; measure false positives.

### Phase 2: Behavioral + cloud intelligence

- **Agent:** add behavior hooks (network domain filtering, SSH key access alerts).
- **Cloud:** reputation DB (PyPI/npm metadata), LLM semantic analysis for top-N uncertain.
- **Integration:** webhook push to XSIAM or Wiz (pick one for beta customer).

**Goal:** detect **novel** threats (0-day typosquatting, prompt injection patterns).

### Phase 3: AI tool runtime + policy tuning

- **Agent:** MCP proxy mode or IDE extension for **tool-level** policy (allow `read`, deny `exec` for certain contexts).
- **Cloud:** policy DSL (OPA/Rego-inspired), version-controlled rules, SOC UI for approvals.
- **Integration:** bidirectional (cloud queries Wiz for context; Wiz receives your findings).

**Goal:** enterprises can **tune** per team/repo; reduce false positives to <1% of installs.

---

## Open questions and design decisions

| Question | Options | Recommendation |
|----------|---------|----------------|
| **Primary OS for v1?** | Linux (eBPF-rich) vs macOS (dev-heavy) | **macOS first** (developer density), Linux second (server/CI runners) |
| **Block vs warn default?** | Strict (block unknown) vs permissive (allow + log) | **Permissive with fast shift to strict** after 2-week baseline |
| **Cloud stack?** | Serverless (Lambda + SQS) vs container (ECS/K8s) | **Serverless for ingestion** (elastic), **containers for LLM** (GPU, longer timeout) |
| **Which SIEM first?** | XSIAM, Wiz, Splunk, generic | **Generic OCSF webhook** (works with all), then Wiz-specific for bidirectional in phase 2 |
| **LLM hosting?** | OpenAI API vs self-hosted (Llama, Mistral) | **Self-hosted SLM** (cost + data residency); GPT-4 for escalation only |

---

## Security and privacy (agent itself)

1. **Agent signing:** binary signed with Apple/MS certs (notarization); Linux packages signed with GPG.
2. **Update channel:** agent checks for updates from **your** signed endpoint; **version pinning** optional for enterprises.
3. **Data minimization:** agent sends **hashes, metadata, verdict** — not full source code by default (opt-in for deep inspection with PII redaction).
4. **Secrets:** agent cert/key in OS keystore (Keychain, Windows Credential Manager, Linux Secret Service); **never** hardcoded.
5. **Logs:** local agent logs **rotate** and **do not** log secrets (redact env vars, tokens).

---

## Why this works in real-time

| Requirement | Architectural answer |
|-------------|---------------------|
| **Immediate block** | Local policy cache + fast rules (hash/regex) give **sub-10ms** verdict for 90%+ of events |
| **No cloud == no block?** | Agent continues with **last known policy** if offline; optional "fail-open" vs "fail-closed" per org policy |
| **Scale (100K endpoints)** | Cloud uses **message queue** to decouple ingestion (elastic) from analysis (batch or stream workers); LLM only for uncertain <1% |
| **SIEM sees it fast** | Webhook push every 1–5s for high-severity; bulk export every 5–15 min for telemetry → XSIAM/Wiz lag is seconds to minutes, acceptable for SOC |
| **Dev friction** | Known-good packages (React, lodash, official VSCode extensions) are **pre-allowed**; devs never wait for cloud on normal workflow |

**Critical insight from research:** industry (Upwind + NVIDIA) and academia (MALGUARD) both show **tiered pipelines** (cheap filter → expensive model only when needed) are the **only** way to hit real-time at scale without burning budget.

---

## Next steps to turn this into a build

1. **Prototype agent (Go)** with npm shim + local rule engine + mock cloud endpoint (2-week sprint).
2. **Define event schema** (OCSF subset) + sample policy JSON (1 week).
3. **Build ingestion API** (serverless: API Gateway + SQS + Lambda) with Postgres for verdicts (1 week).
4. **Pilot with 5 devs** (permissive mode, baseline false positive rate) (2 weeks).
5. **Add LLM analysis** for uncertain packages (self-hosted Llama or API) (1 week).

If you want a **detailed component spec** (agent API surface, policy DSL syntax, OCSF event samples), or a **threat-specific detection rules starter pack** (10–20 rules for npm typosquatting, prompt injection patterns), say which and I'll draft that next.

---

## References

- OCSF schema: [schema.ocsf.io](https://schema.ocsf.io/)
- MALGUARD (USENIX Security 2025): [paper](https://arxiv.org/pdf/2506.14466)
- IDE Shepherd: [github.com/DataDog/IDE-Shepherd-extension](https://github.com/DataDog/IDE-Shepherd-extension)
- Upwind prompt detection: [press release](https://www.businesswire.com/news/home/20260323142408/en/)
- Wiz workflows: [blog post](https://www.wiz.io/blog/introducing-wiz-workflows)
