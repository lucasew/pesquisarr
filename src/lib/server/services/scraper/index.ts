import { reportError } from '$lib/error';
import { matchFirstGroup } from '$lib/utils';
import BaseService from '../base';
import type { TorrentStream } from '../torrent';
import { isValidHttpUrl } from '$lib/url';

export const REGEX_MATCH_MAGNET = /(magnet:[^"' ]*)/g;
export const REGEX_MATCH_INFOHASH = /[0-9A-F]{40}/i;

export default class ScraperService extends BaseService {
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
			reportError(e, { context: 'ScraperService.fetchTorrentsInSite', url });
			return [];
		}
	}

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
