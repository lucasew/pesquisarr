import { defineMiddleware } from 'astro:middleware';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { initializeServices } from '$lib/server/services';
import type { AppEvent } from '$lib/server/app-event';
import { loadWorkerEnv, setRequestWorkerEnv } from '$lib/server/worker-env';

export const onRequest = defineMiddleware(async (context, next) => {
	// Astro 6: do NOT read locals.runtime.env (throws). Use cloudflare:workers instead.
	const cfEnv = await loadWorkerEnv();
	setRequestWorkerEnv(cfEnv);

	const platform = Object.keys(cfEnv).length
		? { env: cfEnv, context: undefined, caches: undefined }
		: undefined;

	const event: AppEvent = {
		request: context.request,
		url: context.url,
		params: context.params as Record<string, string | undefined>,
		locals: context.locals,
		platform
	};

	initializeServices(event);

	return paraglideMiddleware(context.request, async ({ request: localizedRequest, locale }) => {
		context.request = localizedRequest;
		context.locals.locale = locale;
		return next();
	});
});
