import { json } from '$lib/requests';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const { services } = locals;
	const healthChecks = await Promise.all([
		services.torrent.healthCheck(),
		services.search_google.healthCheck(),
		services.search_duckduckgo.healthCheck(),
		services.search_yandex.healthCheck(),
		services.imdb.healthCheck()
	]);
	const overallOk = healthChecks.every((check) => check.ok);
	return json({ ok: overallOk, checks: healthChecks });
};
