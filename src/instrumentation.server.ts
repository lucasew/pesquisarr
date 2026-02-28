import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  dsn: 'https://9de97d2619224108bd22d5b32502ca76@o4508616651505664.ingest.us.sentry.io/4510840434262016',


  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: import.meta.env.DEV,
});