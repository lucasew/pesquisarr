import { isValidImdbId } from '$lib/imdb';
import { json } from '$lib/requests';

export async function GET({ params, services }) {
	if (!isValidImdbId(params.name)) {
		return json({ error: 'Invalid IMDB ID format' }, 400);
	}
	const streams = await services.torrent.getStreams(params.name);
	return json({ streams });
}
