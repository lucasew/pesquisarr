import { json } from '$lib/requests';
import type { AppEvent } from '../app-event';

/** Shared Stremio stream handler for movie/series (same logic, different resource types only). */
export async function handleStremioStream({ params, locals }: AppEvent) {
	const { services } = locals;
	const imdbId = params.name ?? '';
	if (!services.imdb.isValidId(imdbId)) {
		return json({ error: 'Invalid IMDB ID format' }, 400);
	}
	const streams = await services.scraper.getTorrentStreams(imdbId);
	return json({ streams });
}
