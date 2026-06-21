import * as Sentry from '@sentry/astro';

// In wrangler/workerd local dev, outbound TLS to Sentry fails ("unable to get local issuer certificate")
// and uncaught errors take down the whole request. Only enable in real production builds.
const enabled = import.meta.env.PROD && !import.meta.env.DEV;

Sentry.init({
	dsn: 'https://9de97d2619224108bd22d5b32502ca76@o4508616651505664.ingest.us.sentry.io/4510840434262016',
	enabled,

	sendDefaultPii: true,

	integrations: enabled
		? [Sentry.browserTracingIntegration(), Sentry.replayIntegration()]
		: [],

	tracesSampleRate: 0.2,
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0
});
