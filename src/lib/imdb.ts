export const REGEX_IMDB_ID = /^tt\d{7,12}$/;

export function isValidImdbId(id: string): boolean {
	return REGEX_IMDB_ID.test(id);
}
