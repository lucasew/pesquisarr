import BaseService from '../base';
import type { SearchResult } from './base';

export default class SearchService extends BaseService {
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
