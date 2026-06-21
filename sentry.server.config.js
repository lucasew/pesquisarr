import * as Sentry from '@sentry/astro';

// Built output has PROD=true, but wrangler *local* still runs that build and TLS to Sentry fails in workerd.
// Enable only when SENTRY_ENABLED=1 is set at deploy/runtime (or rely on production Workers network which works).
// For Astro static inlining, we gate on import.meta.env.PROD && !import.meta.env.SSR is wrong.
// Safest: only enable when explicitly opted in at build time via PUBLIC_SENTRY_ENABLED.
const enabled = import.meta.env.PUBLIC_SENTRY_ENABLED === 'true' || import.meta.env.PUBLIC_SENTRY_ENABLED === '1';

Sentry.init({
	dsn: 'https://9de97d2619224108bd22d5b32502ca76@o4508616651505664.ingest.us.sentry.io/4510840434262016',
	enabled,
	sendDefaultPii: true,
	tracesSampleRate: enabled ? 0.2 : 0
});
