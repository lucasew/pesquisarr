import { isValidHttpUrl } from '$lib/url';
import { matchFirstGroup } from '$lib/utils';
import BaseService from '../base';

export type SearchResult = { link: string; source: string };

export default class GoogleService extends BaseService {
	async search(query: string): Promise<SearchResult[]> {
		const urlTemplate = 'https://www.google.com/search?q=';
		const regex = /\/url\\?q=([^"&]*)/g;
		try {
			const response = await fetch(`${urlTemplate}${encodeURIComponent(query)}`, {
				cf: {
					cacheTtl: 3600,
					cacheEverything: true
				} as any
			});
			const responseText = await response.text();
			const urls = matchFirstGroup(responseText, regex);
			const decodedUrls = [...new Set(urls)].map((url) => decodeURIComponent(url));
			return decodedUrls
				.filter(isValidHttpUrl)
				.map((url) => ({ link: url, source: 'Google' }));
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async healthCheck() {
		try {
			const results = await this.search('test');
			return { ok: results.length > 0 };
		} catch {
			return { ok: false, error: 'Google search unavailable' };
		}
	}



}
