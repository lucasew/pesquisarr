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
			const urls = this.matchFirstGroup(responseText, regex);
			const decodedUrls = [...new Set(urls)].map((url) => decodeURIComponent(url));
			return decodedUrls
				.filter(this.isValidHttpUrl)
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

	private matchFirstGroup(text: string, regex: RegExp): string[] {
		const matches = [];
		let match;
		while ((match = regex.exec(text)) !== null) {
			matches.push(match[1]);
		}
		return matches;
	}

	private isValidHttpUrl(string: string): boolean {
		let url;
		try {
			url = new URL(string);
		} catch (_) {
			return false;
		}
		return url.protocol === 'http:' || url.protocol === 'https:';
	}
}
