import { json } from '$lib/requests';
import type { RequestEvent } from '@sveltejs/kit';

/** Shared Stremio stream handler for movie/series (same logic, different resource types only). */
export async function handleStremioStream({ params, locals }: RequestEvent) {
	const { services } = locals;
	const imdbId = params.name ?? '';
	if (!services.imdb.isValidId(imdbId)) {
		return json({ error: 'Invalid IMDB ID format' }, 400);
	}
	const streams = await services.scraper.getTorrentStreams(imdbId);
	return json({ streams });
}
