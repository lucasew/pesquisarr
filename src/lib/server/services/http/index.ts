import BaseService from '../base';

export default class HttpService extends BaseService {
	private defaultHeaders = {
		'User-Agent':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
	};

	async fetch(url: string, ttl = 3600): Promise<Response> {
		return fetch(url, {
			headers: this.defaultHeaders,
			// @ts-ignore
			cf: {
				cacheTtl: ttl,
				cacheEverything: true
			}
		});
	}

	async getHtml(url: string, ttl = 3600): Promise<string> {
		const response = await this.fetch(url, ttl);
		if (!response.ok) {
			throw new Error(`Failed to fetch HTML: ${response.statusText}`);
		}
		return response.text();
	}

	async getBuffer(url: string, ttl = 3600): Promise<ArrayBuffer> {
		const response = await this.fetch(url, ttl);
		if (!response.ok) {
			throw new Error(`Failed to fetch Buffer: ${response.statusText}`);
		}
		return response.arrayBuffer();
	}
}
