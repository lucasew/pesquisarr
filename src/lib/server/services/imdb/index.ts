import { htmlSanitize, matchFirstGroup } from '$lib/utils';
import BaseService from '../base';

export default class ImdbService extends BaseService {
	async getTitleById(imdbId: string): Promise<string> {
		const regexImdbMatchTitle = /<title>(.*) - IMDb<\/title>/g;
		const regexImdbId = /^tt\d{7,12}$/;
		if (!regexImdbId.test(imdbId)) {
			throw new Error(`invalid imdb id format for ${imdbId}`);
		}
		try {
			const response = await fetch(`https://www.imdb.com/title/${imdbId}`, {
				// @ts-ignore
				cf: {
					cacheTtl: 3600 * 24,
					cacheEverything: true
				}
			});
			const responseText = await response.text();
			return htmlSanitize(matchFirstGroup(responseText, regexImdbMatchTitle)[0]);
		} catch (e) {
			console.error(e);
			return htmlSanitize(imdbId);
		}
	}

	async healthCheck() {
		try {
			const title = await this.getTitleById('tt0111161'); // Shawshank Redemption
			return { ok: title !== 'tt0111161' };
		} catch {
			return { ok: false, error: 'IMDB unavailable' };
		}
	}
}
