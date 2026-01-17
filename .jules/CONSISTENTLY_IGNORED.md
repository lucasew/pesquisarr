# Consistently Ignored Changes

This file lists patterns of changes that have been consistently rejected by human reviewers. All agents MUST consult this file before proposing a new change. If a planned change matches any pattern described below, it MUST be abandoned.

---

## IGNORE: Adding HSTS Security Header

**- Pattern:** Do not add the `Strict-Transport-Security` (HSTS) header or the `handleSecurityHeaders` middleware.
**- Justification:** This change has been proposed multiple times and rejected. It is considered an operational risk because it can break subdomains that do not support HTTPS. This is a classic example of a security enhancement that, while good in theory, is a breaking change in this specific context.
**- Files Affected:** `src/hooks.server.ts`

---
