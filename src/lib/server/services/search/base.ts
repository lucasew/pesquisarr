import { isValidHttpUrl } from '$lib/url';
import { matchFirstGroup } from '$lib/utils';
import BaseService from '../base';

export type SearchResult = { link: string; source: string };

/**
 * Decode a SERP-captured URL without throwing. A single malformed `%` sequence
 * must not abort decoding of the rest of the result set (URIError from
 * decodeURIComponent would otherwise empty the whole engine response).
 */
export function safeDecodeURIComponent(url: string): string | null {
	try {
		return decodeURIComponent(url);
	} catch {
		// Keep the raw capture when it is still a usable absolute URL; drop otherwise.
		return isValidHttpUrl(url) ? url : null;
	}
}

export default abstract class SearchBaseService extends BaseService {
	abstract get urlTemplate(): string;
	abstract get regex(): RegExp;
	abstract get sourceName(): string;

	async search(query: string): Promise<SearchResult[]> {
		try {
			const responseText = await this.services.http.getHtml(
				`${this.urlTemplate}${encodeURIComponent(query)}`,
				3600
			);
			const urls = matchFirstGroup(responseText, this.regex);
			const decodedUrls = [...new Set(urls)]
				.map(safeDecodeURIComponent)
				.filter((url): url is string => url !== null);
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

	async healthCheck() {
		try {
			const results = await this.search('test');
			return { ok: results.length > 0 };
		} catch (e) {
			console.error(`${this.sourceName} healthCheck failed:`, e);
			return { ok: false, error: `${this.sourceName} search unavailable` };
		}
	}
}
