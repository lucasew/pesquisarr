/**
 * Minimal request context passed to services (replaces SvelteKit RequestEvent).
 */
export interface AppEvent {
	request: Request;
	url: URL;
	params: Record<string, string | undefined>;
	locals: App.Locals;
	platform?: {
		env?: Record<string, unknown>;
		context?: { waitUntil(promise: Promise<unknown>): void };
		caches?: CacheStorage & { default: Cache };
	};
}

export function createAppEvent(
	astro: {
		request: Request;
		url: URL;
		params: Record<string, string | undefined>;
		locals: App.Locals;
	},
	platform?: AppEvent['platform']
): AppEvent {
	return {
		request: astro.request,
		url: astro.url,
		params: astro.params,
		locals: astro.locals,
		platform
	};
}
