import BaseService from '../base';
import config from './config.json';

export default class HttpService extends BaseService {
	private getStealthHeaders(
		url: string,
		extraHeaders: Record<string, string> = {}
	): Record<string, string> {
		const presets = config.presets;
		const preset = presets[Math.floor(Math.random() * presets.length)];

		const headers: Record<string, string> = {
			...config.defaultHeaders,
			'User-Agent': preset.userAgent,
			...(preset.headers as Record<string, string>)
		};

		try {
			const urlObj = new URL(url);
			const referer = extraHeaders['Referer'];

			if (referer) {
				const refObj = new URL(referer);
				headers['Sec-Fetch-Site'] = refObj.host === urlObj.host ? 'same-origin' : 'cross-site';
			} else {
				headers['Sec-Fetch-Site'] = 'none';
			}
		} catch (e) {
			this.services.error.report(e, {
				url,
				referer: extraHeaders['Referer'],
				message: 'Failed to process stealth headers'
			});
			headers['Sec-Fetch-Site'] = 'none';
		}

		return headers;
	}

	async fetch(
		url: string,
		ttl = 3600,
		extraHeaders: Record<string, string> = {}
	): Promise<Response> {
		const headers = {
			...this.getStealthHeaders(url, extraHeaders),
			...extraHeaders
		};

		return fetch(url, {
			headers,
			// @ts-expect-error cf is cloudflare specific
			cf: {
				cacheTtl: ttl,
				cacheEverything: true
			}
		});
	}

	private async fetchOk(
		url: string,
		ttl: number,
		extraHeaders: Record<string, string>,
		kind: 'HTML' | 'Buffer'
	): Promise<Response> {
		const response = await this.fetch(url, ttl, extraHeaders);
		if (!response.ok) {
			throw new Error(`Failed to fetch ${kind}: ${response.statusText}`);
		}
		return response;
	}

	async getHtml(
		url: string,
		ttl = 3600,
		extraHeaders: Record<string, string> = {}
	): Promise<string> {
		const response = await this.fetchOk(url, ttl, extraHeaders, 'HTML');
		return response.text();
	}

	async getBuffer(
		url: string,
		ttl = 3600,
		extraHeaders: Record<string, string> = {}
	): Promise<ArrayBuffer> {
		const response = await this.fetchOk(url, ttl, extraHeaders, 'Buffer');
		return response.arrayBuffer();
	}
}
