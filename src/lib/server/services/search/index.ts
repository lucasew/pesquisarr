import BaseService from '../base';
import type { SearchResult } from './base';

export default class SearchService extends BaseService {
	async search(
		query: string,
		engines: string[] = ['google', 'duckduckgo', 'yandex']
	): Promise<SearchResult[]> {
		const promises = [];

		if (engines.includes('google')) {
			promises.push(this.services.search_google.search(query));
		}
		if (engines.includes('duckduckgo')) {
			promises.push(this.services.search_duckduckgo.search(query));
		}
		if (engines.includes('yandex')) {
			promises.push(this.services.search_yandex.search(query));
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
