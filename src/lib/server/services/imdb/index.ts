import { reportError } from '$lib/error';
import { htmlSanitize, matchFirstGroup } from '$lib/utils';
import BaseService from '../base';

export const REGEX_IMDB_ID = /^tt\d{7,12}$/;

export default class ImdbService extends BaseService {
	REGEX_IMDB_MATCH_TITLE = /<title>(.*) - IMDb<\/title>/g;

	isValidId(id: string): boolean {
		return REGEX_IMDB_ID.test(id);
	}

	async getTitleById(imdbId: string): Promise<string> {
		if (!REGEX_IMDB_ID.test(imdbId)) {
			throw new Error(`invalid imdb id format for ${imdbId}`);
		}
		try {
			const responseText = await this.services.http.getHtml(
				`https://www.imdb.com/title/${imdbId}`,
				3600 * 24
			);
			return htmlSanitize(matchFirstGroup(responseText, this.REGEX_IMDB_MATCH_TITLE)[0]);
		} catch (e) {
			reportError(e, { context: 'ImdbService.getTitleById', imdbId });
			return htmlSanitize(imdbId);
		}
	}

	async healthCheck() {
		try {
			const title = await this.getTitleById('tt0111161'); // Shawshank Redemption
			return { ok: title !== 'tt0111161' };
		} catch (e) {
			reportError(e, { context: 'ImdbService.healthCheck' });
			return { ok: false, error: 'IMDB unavailable' };
		}
	}
}
