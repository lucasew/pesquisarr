import { json } from '$lib/requests';
import type { AppEvent } from '../app-event';
import { REGEX_IMDB_ID } from '../services/imdb';
import type { TorrentStream } from '../services/torrent';

export type StremioVideoId = {
	imdbId: string;
	season?: number;
	episode?: number;
};

/**
 * Parse a Stremio stream resource id.
 *
 * Stremio requests:
 * - movie:  `tt0111161` or `tt0111161.json`
 * - series: `tt0944947:1:2` (imdbId:season:episode), optionally with `.json`
 *
 * Our routes are `[name].ts`, so the path segment may include the `.json`
 * suffix and series season/episode suffix. The base IMDb id is used for title
 * lookup; season/episode (when present) only reorders matching torrent titles.
 */
export function parseStremioVideoId(raw: string): StremioVideoId | null {
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
	const parts = id.split(':');
	const base = parts[0] ?? '';
	if (!REGEX_IMDB_ID.test(base)) {
		return null;
	}

	const result: StremioVideoId = { imdbId: base };
	if (parts.length >= 3) {
		const season = Number(parts[1]);
		const episode = Number(parts[2]);
		if (Number.isInteger(season) && Number.isInteger(episode) && season >= 1 && episode >= 1) {
			result.season = season;
			result.episode = episode;
		}
	}
	return result;
}

/** Episode tags commonly found in torrent names (S01E05, 1x05). */
export function episodeNameTags(season: number, episode: number): string[] {
	const s = String(season).padStart(2, '0');
	const e = String(episode).padStart(2, '0');
	return [`S${s}E${e}`, `S${season}E${episode}`, `${season}x${e}`, `${season}x${episode}`];
}

/**
 * Prefer streams whose title matches the requested episode; keep non-matches after.
 * Does not drop anything — Stremio still sees the full set when nothing matches.
 */
export function preferEpisodeStreams(
	streams: TorrentStream[],
	season: number,
	episode: number
): TorrentStream[] {
	const tags = episodeNameTags(season, episode).map((t) => t.toLowerCase());
	const matched: TorrentStream[] = [];
	const rest: TorrentStream[] = [];
	for (const stream of streams) {
		const title = stream.title.toLowerCase();
		if (tags.some((tag) => title.includes(tag))) matched.push(stream);
		else rest.push(stream);
	}
	return matched.length > 0 ? [...matched, ...rest] : streams;
}

/** Shared Stremio stream handler for movie/series (same logic, different resource types only). */
export async function handleStremioStream({ params, locals }: AppEvent) {
	const { services } = locals;
	const parsed = parseStremioVideoId(params.name ?? '');
	if (!parsed) {
		return json({ error: 'Invalid IMDB ID format' }, 400);
	}

	let streams = await services.scraper.getTorrentStreams(parsed.imdbId);

	if (parsed.season !== undefined && parsed.episode !== undefined) {
		streams = preferEpisodeStreams(streams, parsed.season, parsed.episode);
	}

	return json({ streams });
}
