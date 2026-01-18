import { json } from '$lib/requests';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { services } = locals;
	if (!services.imdb.isValidId(params.name)) {
		return json({ error: 'Invalid IMDB ID format' }, 400);
	}
	const streams = await services.crawler.getTorrentStreams(params.name);
	return json({ streams });
};
