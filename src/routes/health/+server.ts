import { json } from '$lib/requests';

export async function GET({ services }) {
	const healthChecks = await Promise.all([
		services.torrent.healthCheck(),
		services.search_google.healthCheck(),
		services.search_duckduckgo.healthCheck(),
		services.search_yandex.healthCheck(),
		services.imdb.healthCheck()
	]);
	const overallOk = healthChecks.every((check) => check.ok);
	return json({ ok: overallOk, checks: healthChecks });
}
