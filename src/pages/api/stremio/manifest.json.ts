import packagejson from '../../../../package.json';
import type { APIRoute } from 'astro';
import { json } from '$lib/requests';

export const GET: APIRoute = () => {
	return json({
		id: 'com.stremio.pesquisarr.addon',
		name: 'pesquisarr',
		description: 'Stremio addon based on cloudflare workers',
		logo: '/logo.png',
		version: packagejson.version,
		catalogs: [],
		resources: [
			{
				name: 'stream',
				types: ['movie', 'series'],
				idPrefixes: ['tt']
			}
		],
		types: ['movie', 'series']
	});
};
