import { json } from '$lib/requests';

export async function GET({ platform }) {
	const { services } = platform;
	const healthChecks = await Promise.all([
		services.torrent.healthCheck(),
		services.google.healthCheck(),
		services.duckduckgo.healthCheck(),
		services.yandex.healthCheck(),
		services.imdb.healthCheck()
	]);
	const overallOk = healthChecks.every((check) => check.ok);
	return json({ ok: overallOk, checks: healthChecks });
}
