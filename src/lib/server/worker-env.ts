/**
 * Access Cloudflare Worker env bindings (Astro 6+).
 * Uses `cloudflare:workers` on CF; Node/Docker builds alias that specifier to a stub (see astro.config).
 */
export async function loadWorkerEnv(): Promise<Record<string, unknown>> {
	try {
		const mod = await import('cloudflare:workers');
		return (mod.env ?? {}) as Record<string, unknown>;
	} catch {
		return {};
	}
}

// Sync getter used by services — populated by middleware on each request.
let currentEnv: Record<string, unknown> = {};

export function setRequestWorkerEnv(env: Record<string, unknown>) {
	currentEnv = env;
}

export function getRequestWorkerEnv(): Record<string, unknown> {
	return currentEnv;
}
