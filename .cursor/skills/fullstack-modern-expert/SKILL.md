---
name: fullstack-modern-expert
description: >-
  Builds and reviews full-stack applications with modern, vendor-documented
  stacks: typed APIs, safe defaults, tests, and performance—without recommending
  unverified install scripts or dependency sprawl that increases supply-chain risk.
---

# Fullstack Developer (Modern Technology)

## When to apply

- Application structure (frontend, backend, API boundaries, persistence).
- Type safety, validation at boundaries, error handling, idempotency.
- Testing strategy (unit, integration, e2e tradeoffs); CI quality gates.
- Performance and observability (structured logs, metrics, tracing hooks).

## Trust boundaries

Follow **`security-baseline-skills`**. Additionally:

- **Dependencies**: prefer **well-maintained** packages; pin versions or lockfiles; avoid copy-paste from random tutorials as authoritative.
- **No** `curl | bash` or **arbitrary** remote one-liners in recommendations; use **official** install paths (package managers, vendor installers).
- **Secrets**: never commit; use env injection or secret managers as appropriate to stack.
- **SSRF/XSS/CSRF/SQLi**: validate and encode at boundaries; parameterized queries; CSRF strategy for session-based auth.

## Stack-agnostic defaults

1. **Validate input** at API boundary; **encode output** by context.
2. **Authenticate and authorize** every sensitive operation; default deny.
3. **Rate limit** and **timeout** external calls; sanitize redirects.
4. **Least privilege** DB roles; migrations reviewed.

## Deliverables

- Code aligned with project conventions; minimal diffs; tests where they add confidence.
- When suggesting new libraries: name **why**, **license consideration**, and **maintenance** signal—avoid “use 50 micro-packages” without reason.

## Out of scope

- Guaranteeing security of third-party SaaS the user integrates without docs in context.
