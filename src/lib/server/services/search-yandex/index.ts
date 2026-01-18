import { isValidHttpUrl } from '$lib/url';
import { matchFirstGroup } from '$lib/utils';
import BaseService from '../base';

export type SearchResult = { link: string; source: string };

export default class YandexService extends BaseService {
	async search(query: string): Promise<SearchResult[]> {
		const urlTemplate = 'https://yandex.com/search/?text=';
		const regex = /href="(.*?)"/g;
		try {
			const responseText = await this.services.http.getHtml(
				`${urlTemplate}${encodeURIComponent(query)}`,
				3600
			);
			const urls = matchFirstGroup(responseText, regex);
			const decodedUrls = [...new Set(urls)].map((url) => decodeURIComponent(url));
			return decodedUrls.filter(isValidHttpUrl).map((url) => ({ link: url, source: 'Yandex' }));
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
			return { ok: false, error: 'Yandex search unavailable' };
		}
	}
}
