import BaseService from '../base';
import config from './config.json';

export default class HttpService extends BaseService {
	private getRandomUserAgent(): string {
		const agents = config.userAgents;
		return agents[Math.floor(Math.random() * agents.length)];
	}

	private getStealthHeaders(url: string): Record<string, string> {
		const headers: Record<string, string> = {
			...config.defaultHeaders,
			'User-Agent': this.getRandomUserAgent()
		};

		try {
			const urlObj = new URL(url);
			headers['Host'] = urlObj.host;
			// Referer usually points to the search engine or the site's own home if direct
			if (url.includes('google.com')) {
				headers['Sec-Fetch-Site'] = 'same-origin';
			} else {
				headers['Referer'] = `${urlObj.protocol}//${urlObj.host}/`;
				headers['Sec-Fetch-Site'] = 'cross-site';
			}
		} catch {
			// fallback if URL is invalid (unlikely here)
		}

		return headers;
	}

	async fetch(
		url: string,
		ttl = 3600,
		extraHeaders: Record<string, string> = {}
	): Promise<Response> {
		const headers = {
			...this.getStealthHeaders(url),
			...extraHeaders
		};

		return fetch(url, {
			headers,
			// @ts-ignore
			cf: {
				cacheTtl: ttl,
				cacheEverything: true
			}
		});
	}

	async getHtml(
		url: string,
		ttl = 3600,
		extraHeaders: Record<string, string> = {}
	): Promise<string> {
		const response = await this.fetch(url, ttl, extraHeaders);
		if (!response.ok) {
			throw new Error(`Failed to fetch HTML: ${response.statusText}`);
		}
		return response.text();
	}

	async getBuffer(
		url: string,
		ttl = 3600,
		extraHeaders: Record<string, string> = {}
	): Promise<ArrayBuffer> {
		const response = await this.fetch(url, ttl, extraHeaders);
		if (!response.ok) {
			throw new Error(`Failed to fetch Buffer: ${response.statusText}`);
		}
		return response.arrayBuffer();
	}
}
