import BaseService from '../base';
import type { TorrentStream } from '../torrent';
import type { SearchResult } from './base';

const ENGINE_KEYS = {
	google: 'search_google',
	duckduckgo: 'search_duckduckgo',
	yandex: 'search_yandex'
} as const;

type EngineName = keyof typeof ENGINE_KEYS;

/** Engine homepage used as Referer when scraping SERP destinations. */
export const SOURCE_REFERERS: Record<string, string> = {
	Google: 'https://www.google.com/',
	DuckDuckGo: 'https://duckduckgo.com/',
	Yandex: 'https://yandex.com/'
};

const DEFAULT_SCRAPE_LIMIT = 10;

/**
 * Dedupe streams by infoHash (case-insensitive) and union tracker lists so
 * announce URLs from later hits are not dropped when the same torrent appears
 * on multiple pages.
 */
export function mergeStreamsByInfoHash(streams: TorrentStream[]): TorrentStream[] {
	const byHash = new Map<string, TorrentStream>();
	for (const stream of streams) {
		const key = stream.infoHash.toUpperCase();
		const existing = byHash.get(key);
		if (!existing) {
			byHash.set(key, { ...stream, trackers: [...stream.trackers] });
			continue;
		}
		const seen = new Set(existing.trackers);
		for (const tr of stream.trackers) {
			if (!seen.has(tr)) {
				seen.add(tr);
				existing.trackers.push(tr);
			}
		}
	}
	return Array.from(byHash.values());
}

export default class SearchService extends BaseService {
	async search(
		query: string,
		engines: EngineName[] = ['google', 'duckduckgo', 'yandex']
	): Promise<SearchResult[]> {
		const searchTerms = query.toLowerCase().includes('torrent') ? query : `${query} torrent`;

		const promises = engines.map((engine) => {
			const serviceKey = ENGINE_KEYS[engine];
			return this.services[serviceKey].search(searchTerms).catch((e) => {
				this.services.error.report(e, { message: `${engine} search failed` });
				return [] as SearchResult[];
			});
		});

		const results = await Promise.all(promises);
		const flatResults = results.flat();

		// Deduplicate results by link
		return Array.from(new Map(flatResults.map((item) => [item.link, item])).values());
	}

	/**
	 * Rank SERP hits, scrape the top candidates for magnets/torrents, and merge
	 * by infoHash. Shared orchestration for the HTML search page (same pipeline
	 * previously inlined in `search.astro` and duplicated in
	 * `ScraperService.getTorrentStreams`).
	 */
	async scrapeResults(
		searchResults: SearchResult[],
		options: { limit?: number; jitter?: boolean } = {}
	): Promise<TorrentStream[]> {
		const limit = options.limit ?? DEFAULT_SCRAPE_LIMIT;
		const jitter = options.jitter ?? false;

		const refererMap = new Map(searchResults.map((r) => [r.link, r.source]));
		const rankedLinks = this.services.rank.rank(searchResults.map((r) => r.link));
		const topLinks = rankedLinks.slice(0, limit);

		const fetched = await Promise.all(
			topLinks.map(async (url, index) => {
				if (jitter) {
					// Stagger bursts when scraping many hosts in one request path.
					const delay = index * 20 + Math.random() * 100;
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
				const source = refererMap.get(url);
				const referer = source ? SOURCE_REFERERS[source] : undefined;
				try {
					return await this.services.scraper.fetchTorrentsInSite(url, referer);
				} catch (e) {
					this.services.error.report(e, { url, message: 'fetchTorrentsInSite failed' });
					return [] as TorrentStream[];
				}
			})
		);

		return mergeStreamsByInfoHash(fetched.flat());
	}

	/** Run engine search then rank/scrape into unique torrent streams. */
	async searchAndScrape(
		query: string,
		engines?: EngineName[],
		scrapeOptions?: { limit?: number; jitter?: boolean }
	): Promise<TorrentStream[]> {
		const searchResults = await this.search(query, engines);
		return this.scrapeResults(searchResults, scrapeOptions);
	}
}
