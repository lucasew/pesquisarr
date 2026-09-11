import { matchFirstGroup } from '$lib/utils';
import BaseService from '../base';
import type { TorrentStream } from '../torrent';
import { isValidHttpUrl } from '$lib/url';

export const REGEX_MATCH_MAGNET = /(magnet:[^"' ]*)/g;

/** True when the first non-whitespace byte can start a bencode value (dict/list/int/string). */
export function isLikelyBencode(data: ArrayBuffer): boolean {
	const bytes = new Uint8Array(data);
	let i = 0;
	while (
		i < bytes.length &&
		(bytes[i] === 0x09 || bytes[i] === 0x0a || bytes[i] === 0x0d || bytes[i] === 0x20)
	) {
		i++;
	}
	if (i >= bytes.length) return false;
	const c = bytes[i];
	// 'd' | 'l' | 'i' | '0'-'9' (string length prefix)
	return c === 0x64 || c === 0x6c || c === 0x69 || (c >= 0x30 && c <= 0x39);
}

function isTorrentFileUrl(url: string): boolean {
	// Match .torrent before query/hash so CDNs with signed URLs still count
	return /\.torrent(\?|#|$)/i.test(url);
}

export default class ScraperService extends BaseService {
	private magnetsFromText(text: string): TorrentStream[] {
		const magnets = matchFirstGroup(text, REGEX_MATCH_MAGNET);
		return magnets
			.map((m) => this.services.torrent.parseMagnet(m))
			.filter((s): s is TorrentStream => s !== null);
	}

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
			const contentType = (response.headers.get('Content-Type') || '').toLowerCase();

			// Binary torrent path: explicit Content-Type or .torrent URL.
			// Do NOT treat "40 hex chars appear in the URL" as a torrent file — index HTML
			// pages commonly embed the infohash in the path; feeding that HTML to the
			// bencode decoder yields Sentry noise (buffer[0]=60 / '<').
			const preferBinary =
				contentType.includes('application/x-bittorrent') ||
				contentType.includes('application/octet-stream') ||
				isTorrentFileUrl(url);

			if (preferBinary) {
				const arrayBuffer = await response.arrayBuffer();
				if (isLikelyBencode(arrayBuffer)) {
					const stream = await this.services.torrent.decodeTorrent(arrayBuffer);
					return stream ? [stream] : [];
				}
				// Mislabelled HTML/error page (or empty): recover magnets without decoding as torrent
				const text = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
				return this.magnetsFromText(text);
			}

			const text = await response.text();
			return this.magnetsFromText(text);
		} catch (e) {
			this.services.error.report(e, { url, message: 'Error fetching torrents' });
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
