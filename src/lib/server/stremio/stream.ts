import { json } from '$lib/requests';
import type { AppEvent } from '../app-event';
import type { TorrentStream } from '../services/torrent';

export type StremioResourceId = {
	imdbId: string;
	season?: number;
	episode?: number;
};

/**
 * Parse a Stremio stream resource id.
 * Protocol uses `/{resource}/{type}/{id}.json` with ids like `tt0111161`
 * or series episode ids `tt0944947:1:5`.
 */
export function parseStremioResourceId(raw: string): StremioResourceId | null {
	const id = raw.replace(/\.json$/i, '').trim();
	const match = /^(tt\d{7,12})(?::(\d+):(\d+))?$/.exec(id);
	if (!match) return null;

	const result: StremioResourceId = { imdbId: match[1] };
	if (match[2] !== undefined && match[3] !== undefined) {
		const season = Number(match[2]);
		const episode = Number(match[3]);
		if (!Number.isInteger(season) || !Number.isInteger(episode) || season < 1 || episode < 1) {
			return null;
		}
		result.season = season;
		result.episode = episode;
	}
	return result;
}

/** Episode tags commonly found in torrent names (S01E05, 1x05). */
export function episodeNameTags(season: number, episode: number): string[] {
	const s = String(season).padStart(2, '0');
	const e = String(episode).padStart(2, '0');
	return [
		`S${s}E${e}`,
		`S${season}E${episode}`,
		`${season}x${e}`,
		`${season}x${episode}`
	];
}

/** Prefer streams whose title matches the requested episode; keep non-matches after. */
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
	const parsed = parseStremioResourceId(params.name ?? '');
	if (!parsed) {
		return json({ error: 'Invalid IMDB ID format' }, 400);
	}

	let streams = await services.scraper.getTorrentStreams(parsed.imdbId);

	if (parsed.season !== undefined && parsed.episode !== undefined) {
		streams = preferEpisodeStreams(streams, parsed.season, parsed.episode);
	}

	return json({ streams });
}
