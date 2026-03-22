import BaseService from '../base';
import type { SearchResult } from './base';

import type SearchBaseService from './base';

export default class SearchService extends BaseService {
	async search(
		query: string,
		engines: string[] = ['google', 'duckduckgo', 'yandex']
	): Promise<SearchResult[]> {
		const searchTerms = query.toLowerCase().includes('torrent') ? query : `${query} torrent`;

		const engineMap: Record<string, SearchBaseService> = {
			google: this.services.search_google,
			duckduckgo: this.services.search_duckduckgo,
			yandex: this.services.search_yandex
		};

		const promises = engines
			.filter((engine) => engine in engineMap)
			.map((engine) =>
				engineMap[engine].search(searchTerms).catch((e) => {
					this.services.error.report(e, {
						message: `${engineMap[engine].sourceName} search failed`
					});
					return [];
				})
			);

		const results = await Promise.all(promises);
		const flatResults = results.flat();

		// Deduplicate results by link
		const uniqueResults = Array.from(
			new Map(flatResults.map((item) => [item.link, item])).values()
		);

		return uniqueResults;
	}
}
