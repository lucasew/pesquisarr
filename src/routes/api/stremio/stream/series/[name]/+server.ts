import { isValidImdbId } from '$lib/imdb';
import { json } from '$lib/requests';

export async function GET({ params, platform, event }) {
	if (!isValidImdbId(params.name)) {
		return json({ error: 'Invalid IMDB ID format' }, 400);
	}
	const { services } = event;
	const streams = await services.torrent.getStreams(params.name);
	return json({ streams });
}
