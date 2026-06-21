import * as Sentry from '@sentry/astro';

const enabled = import.meta.env.PUBLIC_SENTRY_ENABLED === 'true' || import.meta.env.PUBLIC_SENTRY_ENABLED === '1';

Sentry.init({
	dsn: 'https://9de97d2619224108bd22d5b32502ca76@o4508616651505664.ingest.us.sentry.io/4510840434262016',
	enabled,
	sendDefaultPii: true,
	integrations: enabled
		? [Sentry.browserTracingIntegration(), Sentry.replayIntegration()]
		: [],
	tracesSampleRate: enabled ? 0.2 : 0,
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0
});
