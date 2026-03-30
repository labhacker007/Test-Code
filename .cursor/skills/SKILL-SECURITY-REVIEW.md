# Independent security review: AI/ML and skill governance

**Reviewer role:** Independent security stance for **AI/ML misuse** and **supply-chain safety at the skill layer** (not a formal audit).  
**Scope:** All skills under `.cursor/skills/` in this repository, plus cross-cutting risk.  
**Date:** 2026-03-30

## Executive summary

The skills set is **deliberately restrictive**: expert personas are framed as **advisory**, with explicit **out-of-scope** lists and **trust boundaries** that defer to **`security-baseline-skills`**. No skill instructs the agent to **disable security controls by default**, **run unverified remote installers**, or **treat skills as legal authorization**. Residual risk is **operational** (user overrides, model ignoring instructions) rather than **embedded permissive text** in the skills as written.

## Methodology

1. Read each `SKILL.md` for: blanket permissions, unsafe defaults, dependency/install patterns, secret patterns, legal overreach.  
2. Check alignment with **`security-baseline-skills`**.  
3. Assess **supply-chain risk at skill level**: skills should not embed URLs to mutable scripts, “always use package X” without verification, or credential templates.

## Findings by skill

| Skill | Verdict | Notes |
|-------|---------|--------|
| `security-baseline-skills` | **Pass** | Establishes precedence, no executable payloads, no third-party install commands. |
| `cybersecurity-expert` | **Pass** | Offensive use explicitly excluded; defensive framing only. |
| `cloud-security-expert` | **Pass** | Discourages public data stores and disabling cloud detective controls as defaults. |
| `container-security-expert` | **Pass** | Privileged/hostPath/hostNetwork flagged as exceptional; image pin/verify emphasized. |
| `saas-architecture-expert` | **Pass** | Tenant boundaries and license evasion excluded. |
| `compliance-legal-expert` | **Pass** | Not-law-advice disclaimer prominent; no fraudulent audit guidance. |
| `ux-ui-expert` | **Pass** | Dark patterns and deceptive security UX excluded. |
| `fullstack-modern-expert` | **Pass** | Explicitly rejects `curl \| bash` style; lockfiles and official installs preferred. |
| `ai-ml-expert` | **Pass** | Jailbreaks, third-party prompt abuse, unverified model URLs excluded; governance alignment stated. |

## AI/ML-specific risks (mitigated in current text)

| Risk | Mitigation in skills |
|------|----------------------|
| Jailbreak / abuse assistance | `ai-ml-expert` and `security-baseline-skills` prohibit assisting with jailbreaks and evading provider controls. |
| Unverified model artifacts | `ai-ml-expert` requires official/verified channels and hash verification when available. |
| Data misuse for training | Prohibits guidance to use data without rights or scrape personal data without legal basis. |
| Over-permissive “expert” authority | Each skill defers to org policy and baseline; destructive actions require explicit user confirmation. |

## Supply-chain risk at skill layer

- **No bundled scripts** in these skills: nothing to execute that could be replaced by a malicious update independently of the repo.  
- **No embedded API keys or tokens.**  
- **No instruction to add unauthenticated package registries** or disable package signature verification.  
- **Recommendation:** If future versions add `scripts/`, require review against `security-baseline-skills` and pin interpreter versions in documentation.

## Residual risks (not removed by skill text alone)

1. **Model non-compliance:** The agent might still ignore skill text; organizational policy and tooling (allowlists, CI) remain necessary.  
2. **Stale guidance:** Frameworks evolve; periodic human review of skills is recommended.  
3. **User-requested override:** User can ask to bypass skills; baseline cannot prevent that in the agent runtime.

## Conclusion

**Approved** for intended use as **governance-bounded expert prompts**, with **`security-baseline-skills`** as the controlling skill for conflicts. Re-run this review when adding scripts, external references, or new expert personas.
