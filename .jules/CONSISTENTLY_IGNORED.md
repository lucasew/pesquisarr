# Consistently Ignored Changes

This file lists patterns of changes that have been consistently rejected by human reviewers. All agents MUST consult this file before proposing a new change. If a planned change matches any pattern described below, it MUST be abandoned.

---

## IGNORE: Adding HSTS Security Header

**- Pattern:** Do not add the `Strict-Transport-Security` (HSTS) header or the `handleSecurityHeaders` middleware.
**- Justification:** This change has been proposed multiple times and rejected. It is considered an operational risk because it can break subdomains that do not support HTTPS. This is a classic example of a security enhancement that, while good in theory, is a breaking change in this specific context.
**- Files Affected:** `src/hooks.server.ts`

---

## IGNORE: Moving Sentry initialization out of instrumentation.server.ts
**- Pattern:** Do not delete `src/instrumentation.server.ts` or move its Sentry initialization logic into `src/hooks.server.ts`.
**- Justification:** This change has been consistently rejected across multiple PRs. The Sentry integration relies on the instrumentation hook for early initialization, and migrating it out breaks the intended setup or conflicts with the current adapter configuration.
**- Files Affected:** `src/instrumentation.server.ts`, `src/hooks.server.ts`

## IGNORE: Unnecessary formatting and auto-generated file changes
**- Pattern:** Do not commit unrelated formatting changes to files like `.mcp.json`, `svelte.config.js`, or changes to auto-generated localization files in `src/lib/paraglide/**/*` and `src/lib/messages/*.json` (e.g. adding dummy keys).
**- Justification:** Formatting changes outside the primary scope cause noise and clutter the git history. Modifying auto-generated Paraglide files manually is futile as they are overwritten during the build process, and adding dummy keys just to pass compilation is an incorrect fix.
**- Files Affected:** `.mcp.json`, `svelte.config.js`, `src/lib/paraglide/**/*`, `src/lib/messages/*.json`

## IGNORE: Changing vite/vitest config imports
**- Pattern:** Do not change the `defineConfig` import in `vite.config.ts` from `vite` to `vitest/config`.
**- Justification:** This change has been rejected because it interferes with the Vite/SvelteKit setup. The project configuration expects the import to remain from `vite` or `vitest/config` as it originally was, and changing it to satisfy linting or typing issues breaks the build or test configuration.
**- Files Affected:** `vite.config.ts`
