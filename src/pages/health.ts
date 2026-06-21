import { json } from '$lib/requests';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
	const { services } = locals;
	const healthChecks = await Promise.all([
		services.torrent.healthCheck(),
		services.search_google.healthCheck(),
		services.search_duckduckgo.healthCheck(),
		services.search_yandex.healthCheck(),
		services.imdb.healthCheck(),
		services.error.healthCheck()
	]);
	const overallOk = healthChecks.every((check) => check.ok);
	return json({ ok: overallOk, checks: healthChecks });
};
