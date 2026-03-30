#!/usr/bin/env python3
"""
Architecture Diagram Generator

Analyzes codebase structure and generates ASCII architecture diagrams.
"""

import os
import json
import sys
from pathlib import Path
from typing import Dict, List, Set
from collections import defaultdict

def analyze_go_files(base_path: Path) -> Dict:
    """Analyze Go project structure."""
    components = defaultdict(list)
    
    # Scan agent components
    agent_path = base_path / "agent"
    if agent_path.exists():
        for root, dirs, files in os.walk(agent_path):
            for file in files:
                if file.endswith('.go') and file != 'main.go':
                    rel_path = Path(root).relative_to(agent_path)
                    if len(rel_path.parts) >= 1:
                        component = rel_path.parts[0]
                        components['agent'].append({
                            'name': component,
                            'path': str(rel_path / file)
                        })
    
    # Scan cloud components
    cloud_path = base_path / "cloud"
    if cloud_path.exists():
        for root, dirs, files in os.walk(cloud_path):
            for file in files:
                if file.endswith('.go') and file != 'main.go':
                    rel_path = Path(root).relative_to(cloud_path)
                    if len(rel_path.parts) >= 1:
                        component = rel_path.parts[0]
                        components['cloud'].append({
                            'name': component,
                            'path': str(rel_path / file)
                        })
    
    return components

def generate_component_table(components: Dict) -> str:
    """Generate markdown table of components."""
    lines = ["## Component Map\n"]
    
    if 'agent' in components:
        lines.append("### Agent Components\n")
        lines.append("| Component | Files | Purpose |")
        lines.append("|-----------|-------|---------|")
        
        # Deduplicate by component name
        agent_comps = {}
        for item in components['agent']:
            comp = item['name']
            if comp not in agent_comps:
                agent_comps[comp] = []
            agent_comps[comp].append(item['path'])
        
        for comp, files in sorted(agent_comps.items()):
            lines.append(f"| {comp} | {len(files)} | *Auto-detected* |")
        
        lines.append("")
    
    if 'cloud' in components:
        lines.append("### Cloud Components\n")
        lines.append("| Component | Files | Purpose |")
        lines.append("|-----------|-------|---------|")
        
        cloud_comps = {}
        for item in components['cloud']:
            comp = item['name']
            if comp not in cloud_comps:
                cloud_comps[comp] = []
            cloud_comps[comp].append(item['path'])
        
        for comp, files in sorted(cloud_comps.items()):
            lines.append(f"| {comp} | {len(files)} | *Auto-detected* |")
        
        lines.append("")
    
    return "\n".join(lines)

def generate_ascii_diagram(include_llm: bool = False) -> str:
    """Generate ASCII architecture diagram."""
    
    if include_llm:
        diagram = """
┌─────────────────────────────────────────────────────────────────────┐
│  ENDPOINT (Developer Machine)                                       │
│                                                                     │
│  ┌──────────────────┐       ┌─────────────────────────────────┐   │
│  │  IDE / AI Tools  │───1──>│  Runtime AI Agent               │   │
│  │  (VS Code,       │       │                                 │   │
│  │   Cursor, etc.)  │       │  ┌─────────────────────────┐   │   │
│  └──────────────────┘       │  │ Scanners               │   │   │
│         │                   │  │ • Package              │   │   │
│  ┌──────▼──────────┐        │  │ • Extension            │   │   │
│  │  Package Mgrs   │───2──>│  │ • AI Tool Call         │   │   │
│  │  (npm, pip)     │        │  └─────────┬───────────────┘   │   │
│  └─────────────────┘        │            │                   │   │
│                             │            v                   │   │
│  ┌──────────────────┐       │  ┌─────────────────────────┐   │   │
│  │  Ollama          │<──────┤  │ LLM Analysis (Optional) │   │   │
│  │  (localhost)     │  API  │  │ • Script analysis       │   │   │
│  └──────────────────┘       │  │ • Semantic detection    │   │   │
│                             │  └─────────┬───────────────┘   │   │
│                             │            │                   │   │
│                             │            v                   │   │
│                             │  ┌─────────────────────────┐   │   │
│                             │  │ Policy Engine           │   │   │
│                             │  │ • Rules (15 default)    │   │   │
│                             │  │ • Allowlist/Denylist    │   │   │
│                             │  │ • Cache (5 min TTL)     │   │   │
│                             │  └─────────┬───────────────┘   │   │
│                             │            │                   │   │
│                             │            v                   │   │
│                             │  ┌─────────────────────────┐   │   │
│                             │  │ Event Transport         │   │   │
│                             │  │ • Batch (100/10s)       │   │   │
│                             │  │ • TLS 1.3               │   │   │
│                             │  └─────────┬───────────────┘   │   │
│                             └────────────┼─────────────────────┘   │
│                                          │ 3 (HTTPS)               │
└──────────────────────────────────────────┼─────────────────────────┘
                                           │
                                           v
┌──────────────────────────────────────────────────────────────────────┐
│  CLOUD CONTROL PLANE                                                 │
│                                                                      │
│  ┌───────────────────┐      ┌──────────────────────────────────┐   │
│  │  Event Ingestion  │──4──>│  Policy Distribution             │   │
│  │  • REST API       │      │  • Signed bundles (Ed25519)      │   │
│  │  • Auth (mTLS)    │      │  • Version management            │   │
│  │  • Rate limiting  │      └──────────────────────────────────┘   │
│  └────────┬──────────┘                                              │
│           │ 5                                                        │
│           v                                                          │
│  ┌───────────────────┐      ┌──────────────────────────────────┐   │
│  │  Tiered Analysis  │<─────│  Cloud LLM (Optional)            │   │
│  │  • Reputation DB  │      │  • GPT-4 / Claude                │   │
│  │  • Threat Intel   │      │  • Deep analysis                 │   │
│  │  • Pattern Match  │      └──────────────────────────────────┘   │
│  └────────┬──────────┘                                              │
│           │ 6                                                        │
│           v                                                          │
│  ┌───────────────────┐      ┌──────────────────────────────────┐   │
│  │  PostgreSQL       │      │  Admin / SOC UI                  │   │
│  │  • Events         │<─7───│  • Metrics dashboard             │   │
│  │  • Policies       │      │  • Approval queue                │   │
│  │  • Verdicts       │      │  • Audit logs                    │   │
│  └────────┬──────────┘      └──────────────────────────────────┘   │
│           │ 8 (webhook/API)                                         │
└───────────┼─────────────────────────────────────────────────────────┘
            │
            v
┌───────────────────────────────────────────────────────────────────┐
│  SIEM/XDR INTEGRATION (Enterprise Security Tools)                │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐   │
│  │     XSIAM      │  │      Wiz       │  │    Splunk       │   │
│  │  (Palo Alto)   │  │   (CNAPP)      │  │   (SIEM)        │   │
│  └────────────────┘  └────────────────┘  └─────────────────┘   │
│                                                                   │
│  Format: OCSF 1.8.0 (Open Cybersecurity Schema Framework)        │
└───────────────────────────────────────────────────────────────────┘
"""
    else:
        diagram = """
┌─────────────────────────────────────────────────────────────┐
│  ENDPOINT (Developer Machine)                               │
│                                                             │
│  ┌──────────────────┐       ┌─────────────────────────┐   │
│  │  IDE / AI Tools  │──────>│  Runtime AI Agent       │   │
│  └──────────────────┘       │  • Scanners             │   │
│  ┌──────────────────┐       │  • Policy Engine        │   │
│  │  Package Mgrs    │──────>│  • Event Transport      │   │
│  └──────────────────┘       └──────────┬──────────────┘   │
│                                        │ TLS              │
└────────────────────────────────────────┼──────────────────┘
                                         │
                                         v
┌─────────────────────────────────────────────────────────────┐
│  CLOUD CONTROL PLANE                                        │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Ingestion  │─>│   Analysis   │─>│  SIEM Export    │   │
│  │     API     │  │  (Rules)     │  │   (OCSF/CEF)    │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
│         │                  │                  │             │
│         v                  v                  v             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           PostgreSQL (Events, Policies, Verdicts)     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         │
                         v
              ┌──────────────────────┐
              │  SIEM/XDR (External) │
              │  • XSIAM              │
              │  • Wiz                │
              │  • Splunk             │
              └──────────────────────┘
"""
    
    return diagram.strip()

def generate_mermaid_sequence() -> str:
    """Generate Mermaid sequence diagram."""
    return '''```mermaid
sequenceDiagram
    participant Dev as Developer
    participant PM as Package Manager
    participant Agent as AI Security Agent
    participant LLM as Ollama (Local)
    participant Cloud as Cloud API
    participant SIEM as XSIAM/Wiz

    Dev->>PM: npm install package
    PM->>Agent: Install intercepted
    
    Agent->>Agent: Check local cache
    alt Cache Hit
        Agent->>PM: Cached verdict (1ms)
    else Cache Miss
        Agent->>Agent: Evaluate rules
        
        alt Rule Match (High Confidence)
            Agent->>PM: Allow/Deny (5ms)
        else Uncertain
            Agent->>LLM: Analyze script
            LLM->>Agent: Verdict + confidence
            
            alt High Confidence
                Agent->>PM: Allow/Deny (2s)
            else Low Confidence
                Agent->>Cloud: Request analysis
                Cloud->>Cloud: Threat intel lookup
                Cloud->>Agent: Final verdict
                Agent->>PM: Allow/Deny (5s)
            end
        end
    end
    
    Agent->>Cloud: Log event (async, batched)
    Cloud->>Cloud: Store in PostgreSQL
    Cloud->>SIEM: Export as OCSF (webhook)
```'''

def main():
    """Generate architecture documentation."""
    base_path = Path.cwd()
    
    # Detect if LLM integration exists
    llm_file = base_path / "agent" / "internal" / "analysis" / "llm.go"
    has_llm = llm_file.exists()
    
    print("# Runtime AI Security Platform - Architecture")
    print()
    print(f"**Generated**: {os.popen('date +\"%Y-%m-%d %H:%M\"').read().strip()}")
    print(f"**LLM Integration**: {'Enabled' if has_llm else 'Not yet implemented'}")
    print()
    
    # Component analysis
    components = analyze_go_files(base_path)
    
    # Generate diagrams
    print("## System Architecture\n")
    print(generate_ascii_diagram(include_llm=has_llm))
    print()
    
    print("## Event Flow\n")
    print(generate_mermaid_sequence())
    print()
    
    # Component table
    if components:
        print(generate_component_table(components))
    
    # Statistics
    print("## Project Statistics\n")
    
    go_files = list(Path(base_path).rglob("*.go"))
    print(f"- **Go files**: {len(go_files)}")
    
    if (base_path / "rules").exists():
        rules = list((base_path / "rules").rglob("*.json"))
        print(f"- **Detection rules**: {len(rules)}")
    
    if (base_path / "docs").exists():
        docs = list((base_path / "docs").rglob("*.md"))
        print(f"- **Documentation files**: {len(docs)}")
    
    print()
    print("---")
    print("*Generated by documentation-expert skill*")

if __name__ == "__main__":
    main()
