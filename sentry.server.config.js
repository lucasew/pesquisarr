import * as Sentry from '@sentry/astro';

// workerd local (wrangler dev) has incomplete CA trust; Sentry transport throws and 500s every route.
const enabled = import.meta.env.PROD && !import.meta.env.DEV;

Sentry.init({
	dsn: 'https://9de97d2619224108bd22d5b32502ca76@o4508616651505664.ingest.us.sentry.io/4510840434262016',
	enabled,

	sendDefaultPii: true,

	// spotlight: import.meta.env.DEV,

	tracesSampleRate: enabled ? 0.2 : 0
});
