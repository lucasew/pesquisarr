import BaseService from '../base';
import config from './config.json';

export type HttpBodyKind = 'HTML' | 'Buffer';

/** HTTP statuses a caller can treat as a temporary upstream outage. */
const TRANSIENT_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

export function isTransientHttpStatus(status: number): boolean {
	return TRANSIENT_HTTP_STATUSES.has(status) || (status >= 520 && status <= 524);
}

function failureDetail(statusText: string | undefined, cause: unknown): string {
	if (statusText !== undefined) return statusText;
	if (cause instanceof Error && cause.message) return cause.message;
	if (typeof cause === 'string' && cause) return cause;
	return 'Network error';
}

/**
 * Fetch failed before a usable body was available.
 * `status` is set for HTTP responses and omitted when the connection itself failed.
 */
export class HttpFetchError extends Error {
	readonly status?: number;
	readonly url: string;
	readonly kind: HttpBodyKind;

	constructor(options: {
		kind: HttpBodyKind;
		url: string;
		status?: number;
		statusText?: string;
		cause?: unknown;
	}) {
		const detail = failureDetail(options.statusText, options.cause);
		super(`Failed to fetch ${options.kind}: ${detail}`, { cause: options.cause });
		this.name = 'HttpFetchError';
		this.status = options.status;
		this.url = options.url;
		this.kind = options.kind;
	}

	/** True for rate limits, gateway errors, and dropped connections. */
	get transient(): boolean {
		return this.status === undefined || isTransientHttpStatus(this.status);
	}
}

export function isExpectedUpstreamFailure(error: unknown): error is HttpFetchError {
	return error instanceof HttpFetchError && error.transient;
}

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
				cacheEverything: true,
				// Keep error responses out of the edge cache so a short retry reaches origin.
				cacheTtlByStatus: {
					'400-499': 0,
					'500-599': 0
				}
			}
		});
	}

	private async fetchOk(
		url: string,
		ttl: number,
		extraHeaders: Record<string, string>,
		kind: HttpBodyKind
	): Promise<Response> {
		let response: Response;
		try {
			response = await this.fetch(url, ttl, extraHeaders);
		} catch (cause) {
			throw new HttpFetchError({ kind, url, cause });
		}
		if (!response.ok) {
			throw new HttpFetchError({
				kind,
				url,
				status: response.status,
				statusText: response.statusText
			});
		}
		return response;
	}

	private async readBody<T>(
		response: Response,
		url: string,
		kind: HttpBodyKind,
		read: () => Promise<T>
	): Promise<T> {
		try {
			return await read();
		} catch (cause) {
			throw new HttpFetchError({ kind, url, cause });
		}
	}

	async getHtml(
		url: string,
		ttl = 3600,
		extraHeaders: Record<string, string> = {}
	): Promise<string> {
		const response = await this.fetchOk(url, ttl, extraHeaders, 'HTML');
		return this.readBody(response, url, 'HTML', () => response.text());
	}

	async getBuffer(
		url: string,
		ttl = 3600,
		extraHeaders: Record<string, string> = {}
	): Promise<ArrayBuffer> {
		const response = await this.fetchOk(url, ttl, extraHeaders, 'Buffer');
		return this.readBody(response, url, 'Buffer', () => response.arrayBuffer());
	}
}
