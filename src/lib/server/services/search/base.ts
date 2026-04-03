import { isValidHttpUrl } from '$lib/url';
import { matchFirstGroup } from '$lib/utils';
import BaseService from '../base';

export type SearchResult = { link: string; source: string };

/**
 * Base abstract class for search engine scrapers.
 * It provides the core workflow: fetching HTML, extracting links via regex,
 * decoding URLs, deduplicating, and validating them.
 */
export default abstract class SearchBaseService extends BaseService {
	abstract get urlTemplate(): string;
	abstract get regex(): RegExp;
	abstract get sourceName(): string;

	/**
	 * Executes the search query against the engine.
	 *
	 * - Uses HTTP caching (ttl=3600) to avoid rate limits.
	 * - Extracts links from the raw HTML using the engine-specific regex.
	 * - Deduplicates and decodes URLs.
	 * - Validates URLs and drops invalid ones.
	 * - On failure, reports to the centralized error service and returns an empty array to prevent crashing aggregators.
	 *
	 * @param query The user's search query
	 * @returns Array of validated search results (links and their source engine)
	 */
	async search(query: string): Promise<SearchResult[]> {
		try {
			const responseText = await this.services.http.getHtml(
				`${this.urlTemplate}${encodeURIComponent(query)}`,
				3600
			);
			const urls = matchFirstGroup(responseText, this.regex);
			const decodedUrls = [...new Set(urls)].map((url) => decodeURIComponent(url));
			return decodedUrls
				.filter(isValidHttpUrl)
				.map((url) => ({ link: url, source: this.sourceName }));
		} catch (e) {
			this.services.error.report(e, {
				sourceName: this.sourceName,
				query,
				message: 'Search failed'
			});
			return [];
		}
	}

	/**
	 * Checks if the engine is reachable and returning parsable results.
	 */
	async healthCheck() {
		try {
			const results = await this.search('test');
			return { ok: results.length > 0 };
		} catch {
			return { ok: false, error: `${this.sourceName} search unavailable` };
		}
	}
}
