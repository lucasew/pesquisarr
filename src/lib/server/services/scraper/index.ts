import { matchFirstGroup } from '$lib/utils';
import BaseService from '../base';
import type { TorrentStream } from '../torrent';
import { isValidHttpUrl } from '$lib/url';

export const REGEX_MATCH_MAGNET = /(magnet:[^"' ]*)/g;
export const REGEX_MATCH_INFOHASH = /[0-9A-F]{40}/i;

/**
 * Orchestration service for resolving search results into actual torrent streams.
 * Acts as the bridge between search engine results, direct torrent downloads, and HTML scraping.
 */
export default class ScraperService extends BaseService {
	/**
	 * Inspects a given URL to fetch and decode torrent data based on the HTTP `Content-Type`.
	 *
	 * - If it identifies a `.torrent` file (via MIME type or URL extension), it downloads
	 *   and decodes the bencoded buffer.
	 * - Otherwise, it fetches the HTML and scrapes the page using regex for magnet URIs.
	 *
	 * Note: Bypasses fetching entirely if the `url` is an invalid HTTP string.
	 *
	 * @param url - The external site URL or direct `.torrent` download link
	 * @param referer - Optional referer header for bypassing hotlinking protection on certain trackers
	 * @returns An array of parsed `TorrentStream`s found at the target URL
	 */
	async fetchTorrentsInSite(url: string, referer?: string): Promise<TorrentStream[]> {
		if (!isValidHttpUrl(url)) {
			return [];
		}
		try {
			const extraHeaders: Record<string, string> = {};
			if (referer) {
				extraHeaders['Referer'] = referer;
			}
			const response = await this.services.http.fetch(url, 2 * 3600, extraHeaders);
			const contentType = response.headers.get('Content-Type') || '';
			if (
				contentType.includes('application/x-bittorrent') ||
				url.search(REGEX_MATCH_INFOHASH) !== -1 ||
				url.endsWith('.torrent')
			) {
				const arrayBuffer = await response.arrayBuffer();
				const stream = await this.services.torrent.decodeTorrent(arrayBuffer);
				return stream ? [stream] : [];
			} else if (contentType.includes('application/octet-stream')) {
				return [];
			} else {
				const text = await response.text();
				const magnets = matchFirstGroup(text, REGEX_MATCH_MAGNET);
				return magnets
					.map((m) => this.services.torrent.parseMagnet(m))
					.filter((s): s is TorrentStream => s !== null);
			}
		} catch (e) {
			this.services.error.report(e, { url, message: 'Error fetching torrents' });
			return [];
		}
	}

	/**
	 * Main workflow to discover torrent streams for a given IMDb title.
	 *
	 * 1. Fetches the readable title from IMDb.
	 * 2. Queries multiple search engines concurrently (`SearchService`).
	 * 3. Ranks and limits the unified links (`RankService`).
	 * 4. Iterates over the top links to fetch their actual torrents (`fetchTorrentsInSite`).
	 *    - Employs a staggered jitter delay during concurrent fetching to avoid HTTP burst limits.
	 * 5. Deduplicates all found streams by `infoHash` and returns the final unique list.
	 *
	 * @param imdbId - The canonical IMDb identifier (e.g. "tt0111161")
	 * @returns An array of unique, parsed torrent streams corresponding to the given title
	 */
	async getTorrentStreams(imdbId: string): Promise<TorrentStream[]> {
		const title = await this.services.imdb.getTitleById(imdbId);
		const searchResults = await this.services.search.search(title);

		const refererMap = new Map(searchResults.map((r) => [r.link, r.source]));
		const rankedLinks = this.services.rank.rank(searchResults.map((l) => l.link));

		// Use a limited number of links to avoid hitting limits or taking too long
		const topLinks = rankedLinks.slice(0, 10);

		const sourceReferers: Record<string, string> = {
			Google: 'https://www.google.com/',
			DuckDuckGo: 'https://duckduckgo.com/',
			Yandex: 'https://yandex.com/'
		};

		const fetchedResults = await Promise.all(
			topLinks.map(async (url, index) => {
				// Add jitter to avoid simultaneous bursts
				const delay = index * 20 + Math.random() * 100;
				await new Promise((resolve) => setTimeout(resolve, delay));
				const source = refererMap.get(url);
				const referer = source ? sourceReferers[source] : undefined;
				return this.fetchTorrentsInSite(url, referer);
			})
		);

		const allStreams = fetchedResults.flat();

		// Remove duplicates by infoHash
		const uniqueStreams = Array.from(
			new Map(allStreams.map((s) => [s.infoHash.toUpperCase(), s])).values()
		);

		return uniqueStreams;
	}
}
