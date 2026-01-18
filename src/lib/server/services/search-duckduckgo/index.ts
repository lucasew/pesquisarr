import { matchFirstGroup } from '$lib/utils';
import { isValidHttpUrl } from '$lib/url';
import BaseService from '../base';

export default class DuckDuckGoService extends BaseService {
	async search(query: string) {
		const urlTemplate = 'https://duckduckgo.com/html?q=';
		const regex = /uddg=([^&"]*)/g;
		try {
			const response = await fetch(`${urlTemplate}${encodeURIComponent(query)}`, {
				// @ts-ignore
				cf: {
					cacheTtl: 3600,
					cacheEverything: true
				}
			});
			const responseText = await response.text();
			const urls = matchFirstGroup(responseText, regex);
			const decodedUrls = [...new Set(urls)].map((url) => decodeURIComponent(url));
			return decodedUrls.filter(isValidHttpUrl).map((url) => ({ link: url, source: 'DuckDuckGo' }));
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
			return { ok: false, error: 'DuckDuckGo search unavailable' };
		}
	}
}
