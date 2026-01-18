import { matchFirstGroup } from '$lib/utils';
import { isValidHttpUrl } from '$lib/url';
import BaseService from '../base';

export default class DuckDuckGoService extends BaseService {
	async search(query: string) {
		const urlTemplate = 'https://duckduckgo.com/html?q=';
		const regex = /uddg=([^&"]*)/g;
		try {
			const responseText = await this.services.http.getHtml(
				`${urlTemplate}${encodeURIComponent(query)}`,
				3600
			);
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
