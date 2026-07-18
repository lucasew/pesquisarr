import { json } from '$lib/requests';
import type { AppEvent } from '../app-event';
import { REGEX_IMDB_ID } from '../services/imdb';

/**
 * Normalize a Stremio stream resource id to a bare IMDb title id.
 *
 * Stremio requests:
 * - movie:  `tt0111161` or `tt0111161.json`
 * - series: `tt0944947:1:2` (imdbId:season:episode), optionally with `.json`
 *
 * Our routes are `[name].ts`, so the path segment may include the `.json`
 * suffix and series season/episode suffix. Both must be stripped before
 * IMDb validation and title lookup.
 */
export function parseStremioVideoId(raw: string): string | null {
	// Path segment may be URL-encoded (e.g. colons as %3A).
	let id = raw.trim();
	try {
		id = decodeURIComponent(id);
	} catch {
		// Keep raw when malformed % sequences appear; validation below decides.
	}

	// Stremio protocol appends `.json` to resource requests.
	if (id.toLowerCase().endsWith('.json')) {
		id = id.slice(0, -'.json'.length);
	}

	// Series video ids are `tt…:season:episode` (extra segments ignored).
	const base = id.split(':')[0] ?? '';
	if (!REGEX_IMDB_ID.test(base)) {
		return null;
	}
	return base;
}

/** Shared Stremio stream handler for movie/series (same logic, different resource types only). */
export async function handleStremioStream({ params, locals }: AppEvent) {
	const { services } = locals;
	const imdbId = parseStremioVideoId(params.name ?? '');
	if (!imdbId) {
		return json({ error: 'Invalid IMDB ID format' }, 400);
	}
	const streams = await services.scraper.getTorrentStreams(imdbId);
	return json({ streams });
}
