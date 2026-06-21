import * as Sentry from '@sentry/astro';

// Server-only (`enabled.client: false` in astro.config). No browser/replay SDK.
// PROD enables reporting on real deploys (CF Workers + Node/Docker).
// Local CF (`npm run dev:cf`) sets SENTRY_DISABLED=1 at build so workerd TLS failures
// don't 500 every route; pass SENTRY_DISABLED=1 yourself for any other local production build.
const enabled = import.meta.env.PROD;

Sentry.init({
	dsn: 'https://9de97d2619224108bd22d5b32502ca76@o4508616651505664.ingest.us.sentry.io/4510840434262016',
	enabled,
	// Request URLs/query strings may include search terms; keep PII off by default.
	sendDefaultPii: false,
	tracesSampleRate: enabled ? 0.2 : 0
});
