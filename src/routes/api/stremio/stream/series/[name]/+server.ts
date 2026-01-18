import { isValidImdbId } from '$lib/imdb';
import { json } from '$lib/requests';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!isValidImdbId(params.name)) {
		return json({ error: 'Invalid IMDB ID format' }, 400);
	}
	const { services } = locals;
	const streams = await services.crawler.getTorrentStreams(params.name);
	return json({ streams });
};
