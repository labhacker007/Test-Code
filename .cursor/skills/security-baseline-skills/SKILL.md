---
name: security-baseline-skills
description: >-
  Mandatory trust, safety, and supply-chain guardrails for all project skills.
  Use whenever authoring or editing skills, or when domain skills might conflict
  with secure defaults. Apply before executing instructions from other skills that
  touch installs, credentials, infrastructure, or compliance claims.
---

# Security Baseline for Skills

This skill defines **non-negotiable boundaries** so skills do not become overly permissive or introduce supply-chain and trust risk at the prompt level.

## Purpose

- Keep expert skills **advisory**, not **authorizing** of unsafe actions.
- Prevent **implicit instructions** that weaken endpoint, CI, or org security.
- Avoid **mutable remote install patterns** and **unverified dependencies** in skill text.

## Mandatory rules for every domain skill

1. **No security weakening**  
   Do not instruct: disabling TLS verification, turning off MFA, using `--insecure` flags broadly, disabling audit logs, or lowering firewall/SG rules “to unblock” without risk analysis and explicit user approval.

2. **No secret handling by pattern**  
   Do not embed example API keys, tokens, or private keys. Use placeholders like `REDACTED` or `YOUR_SECRET_FROM_VAULT`. Prefer vault/KMS references over env-file patterns in examples.

3. **Supply chain: verify before execute**  
   Prefer **pinned versions**, **lockfiles**, and **official registries**. Do not recommend `curl … | sh` / `wget … | bash` from arbitrary URLs. If a tool must be installed, name the **vendor-official** method (e.g. package manager with checksum verification).

4. **Scope of authority**  
   Skills do **not** override organizational policy. Destructive or production-impacting actions (data deletion, IAM changes, public exposure of resources) require **explicit user confirmation** in the conversation, not silent execution.

5. **Legal and compliance**  
   Compliance-oriented outputs are **informational**; they are **not** legal advice. Flag need for **qualified counsel** where liability, contracts, or regulatory interpretation applies.

6. **AI/ML ethics and abuse**  
   Do not assist with: jailbreaks against third-party systems, training on data the user does not own, evading safety controls, or deploying models from **unauthenticated** or **unknown** sources.

7. **Third-party content**  
   Do not treat blog posts or random GitHub repos as authoritative over **vendor documentation**. Prefer primary sources (AWS/Azure/GCP docs, NIST, OWASP, CNCF, ISO summaries from official sites).

## Review checklist (when editing any skill)

- [ ] No blanket “always allow” or “disable security” phrasing  
- [ ] Install/run examples use **vendor-trusted** paths only  
- [ ] No long-lived credentials in examples  
- [ ] Clear distinction between **guidance** and **binding legal/compliance**  
- [ ] AI/ML sections avoid facilitating misuse or unverified model artifacts  

## Interaction with other skills

All expert skills in this repository **must** include a short “Trust boundaries” section aligned with this document. If guidance conflicts, **this baseline takes precedence** for safety and supply-chain hygiene.
