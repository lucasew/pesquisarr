import { defineMiddleware } from 'astro:middleware';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { initializeServices } from '$lib/server/services';
import type { AppEvent } from '$lib/server/app-event';

export const onRequest = defineMiddleware(async (context, next) => {
	const platform = (context.locals as { runtime?: { env?: Record<string, unknown> } }).runtime
		? {
				env: (context.locals as { runtime: { env?: Record<string, unknown> } }).runtime.env,
				context: undefined,
				caches: undefined
			}
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
