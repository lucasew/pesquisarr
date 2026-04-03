import BaseService from '../base';
import type { SearchResult } from './base';

/**
 * Aggregator service that unifies results from multiple search engines.
 * Acts as the main entry point for finding external torrent links.
 */
export default class SearchService extends BaseService {
	/**
	 * Queries multiple search engines concurrently and aggregates their results.
	 *
	 * - Automatically appends "torrent" to the query if it isn't already present to improve relevance.
	 * - Executes engine searches in parallel (`Promise.all`).
	 * - Uses isolated `.catch()` blocks for each engine so that if one engine fails (e.g. rate limit),
	 *   it falls back to an empty array and allows other engines to succeed. Reports failures centrally.
	 * - Flattens the aggregated results and deduplicates them by `link` to ensure unique URLs.
	 *
	 * @param query The raw user query
	 * @param engines The list of search engines to use (defaults to google, duckduckgo, yandex)
	 * @returns A deduplicated array of search results from all successful engines
	 */
	async search(
		query: string,
		engines: string[] = ['google', 'duckduckgo', 'yandex']
	): Promise<SearchResult[]> {
		const searchTerms = query.toLowerCase().includes('torrent') ? query : `${query} torrent`;
		const promises = [];

		if (engines.includes('google')) {
			promises.push(
				this.services.search_google.search(searchTerms).catch((e) => {
					this.services.error.report(e, { message: 'Google search failed' });
					return [];
				})
			);
		}
		if (engines.includes('duckduckgo')) {
			promises.push(
				this.services.search_duckduckgo.search(searchTerms).catch((e) => {
					this.services.error.report(e, { message: 'DuckDuckGo search failed' });
					return [];
				})
			);
		}
		if (engines.includes('yandex')) {
			promises.push(
				this.services.search_yandex.search(searchTerms).catch((e) => {
					this.services.error.report(e, { message: 'Yandex search failed' });
					return [];
				})
			);
		}

		const results = await Promise.all(promises);
		const flatResults = results.flat();

		// Deduplicate results by link
		const uniqueResults = Array.from(
			new Map(flatResults.map((item) => [item.link, item])).values()
		);

		return uniqueResults;
	}
}
