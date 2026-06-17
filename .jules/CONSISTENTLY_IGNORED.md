# Consistently Ignored Changes

This file lists patterns of changes that have been consistently rejected by human reviewers. All agents MUST consult this file before proposing a new change. If a planned change matches any pattern described below, it MUST be abandoned.

---

## IGNORE: Unnecessary config formatting and Modifying auto-generated localization files

**- Pattern:** Making out-of-scope formatting changes (e.g., tabs vs spaces) to `.mcp.json` or `svelte.config.js` or manually editing files in `src/lib/paraglide/**/*` or adding dummy keys to `src/lib/messages/*.json`.
**- Justification:** These are unnecessary formatting changes to configurations, and modifying auto-generated localization files is not useful because they will be overwritten or it breaks the compilation/generation process.
**- Files Affected:** `.mcp.json`, `svelte.config.js`, `src/lib/paraglide/**/*`, `src/lib/messages/*.json`

## IGNORE: Changing vite.config.ts imports

**- Pattern:** Changing the `defineConfig` import in `vite.config.ts` from `vite` to `vitest/config`.
**- Justification:** Changes to the `defineConfig` import in `vite.config.ts` consistently break things and should be avoided.
**- Files Affected:** `vite.config.ts`

## IGNORE: Moving Sentry initialization

**- Pattern:** Modifying `svelte.config.js` to disable instrumentation, and moving Sentry initialization from `src/instrumentation.server.ts` to `src/hooks.server.ts`.
**- Justification:** Sentry initialization should remain in `src/instrumentation.server.ts`, and instrumentation should remain enabled.
**- Files Affected:** `src/instrumentation.server.ts`, `src/hooks.server.ts`, `svelte.config.js`

## IGNORE: Adding HSTS Security Header

**- Pattern:** Do not add the `Strict-Transport-Security` (HSTS) header or the `handleSecurityHeaders` middleware.
**- Justification:** This change has been proposed multiple times and rejected. It is considered an operational risk because it can break subdomains that do not support HTTPS. This is a classic example of a security enhancement that, while good in theory, is a breaking change in this specific context.
**- Files Affected:** `src/hooks.server.ts`

---
