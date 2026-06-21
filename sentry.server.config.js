import * as Sentry from '@sentry/astro';

// Server-only Sentry. Client SDK is disabled in astro.config (`enabled.client: false`).
// Enable in production builds; local/wrangler can still set SENTRY_DISABLED=1 at build time
// to drop the integration entirely if workerd TLS noise is an issue.
const enabled = import.meta.env.PROD;

Sentry.init({
	dsn: 'https://9de97d2619224108bd22d5b32502ca76@o4508616651505664.ingest.us.sentry.io/4510840434262016',
	enabled,
	sendDefaultPii: true,
	tracesSampleRate: enabled ? 0.2 : 0
});
