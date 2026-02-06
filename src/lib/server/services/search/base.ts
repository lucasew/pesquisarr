import { reportError } from '$lib/error';
import { isValidHttpUrl } from '$lib/url';
import { matchFirstGroup } from '$lib/utils';
import BaseService from '../base';

export type SearchResult = { link: string; source: string };

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
			const decodedUrls = [...new Set(urls)].map((url) => decodeURIComponent(url));
			return decodedUrls
				.filter(isValidHttpUrl)
				.map((url) => ({ link: url, source: this.sourceName }));
		} catch (e) {
			reportError(e, {
				context: 'SearchBaseService.search',
				source: this.sourceName,
				query
			});
			return [];
		}
	}

	async healthCheck() {
		try {
			const results = await this.search('test');
			return { ok: results.length > 0 };
		} catch (e) {
			reportError(e, { context: 'SearchBaseService.healthCheck', source: this.sourceName });
			return { ok: false, error: `${this.sourceName} search unavailable` };
		}
	}
}
