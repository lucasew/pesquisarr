import BaseService from '../base';
import type { SearchResult } from './base';

const ENGINE_KEYS = {
	google: 'search_google',
	duckduckgo: 'search_duckduckgo',
	yandex: 'search_yandex'
} as const;

type EngineName = keyof typeof ENGINE_KEYS;

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
}
