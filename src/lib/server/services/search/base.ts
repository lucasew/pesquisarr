import { isValidHttpUrl } from '$lib/url';
import { matchFirstGroup } from '$lib/utils';
import BaseService from '../base';
import { isExpectedUpstreamFailure } from '../http';

/** One quick retry — long enough to ride out a blip, short enough for a Worker request. */
const UPSTREAM_ATTEMPTS = 2;
const UPSTREAM_BACKOFF_MS = 200;

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export type SearchResult = { link: string; source: string };

/**
 * Decode a SERP-captured URL without throwing. A single malformed `%` sequence
 * must not abort decoding of the rest of the result set (URIError from
 * decodeURIComponent would otherwise empty the whole engine response).
 */
export function safeDecodeURIComponent(url: string): string | null {
	try {
		return decodeURIComponent(url);
	} catch {
		// Keep the raw capture when it is still a usable absolute URL; drop otherwise.
		return isValidHttpUrl(url) ? url : null;
	}
}

export default abstract class SearchBaseService extends BaseService {
	abstract get urlTemplate(): string;
	abstract get regex(): RegExp;
	abstract get sourceName(): string;

	private async fetchHtml(query: string): Promise<string> {
		const url = `${this.urlTemplate}${encodeURIComponent(query)}`;
		let lastError: unknown;
		for (let attempt = 1; attempt <= UPSTREAM_ATTEMPTS; attempt++) {
			try {
				return await this.services.http.getHtml(url, 3600);
			} catch (error) {
				lastError = error;
				if (!isExpectedUpstreamFailure(error) || attempt === UPSTREAM_ATTEMPTS) {
					throw error;
				}
				await wait(UPSTREAM_BACKOFF_MS * attempt);
			}
		}
		throw lastError;
	}

	async search(query: string): Promise<SearchResult[]> {
		try {
			const responseText = await this.fetchHtml(query);
			const urls = matchFirstGroup(responseText, this.regex);
			const decodedUrls = [...new Set(urls)]
				.map(safeDecodeURIComponent)
				.filter((url): url is string => url !== null);
			return decodedUrls
				.filter(isValidHttpUrl)
				.map((url) => ({ link: url, source: this.sourceName }));
		} catch (e) {
			if (isExpectedUpstreamFailure(e)) {
				this.services.error.warn(e, {
					sourceName: this.sourceName,
					query,
					status: e.status,
					message: 'Search source unavailable'
				});
			} else {
				this.services.error.report(e, {
					sourceName: this.sourceName,
					query,
					message: 'Search failed'
				});
			}
			return [];
		}
	}

	async healthCheck() {
		try {
			const results = await this.search('test');
			return { ok: results.length > 0 };
		} catch (e) {
			console.error(`${this.sourceName} healthCheck failed:`, e);
			return { ok: false, error: `${this.sourceName} search unavailable` };
		}
	}
}
