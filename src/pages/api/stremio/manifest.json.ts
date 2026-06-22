import packagejson from '../../../../package.json';
import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
	return new Response(
		JSON.stringify({
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
		}),
		{
			status: 200,
			headers: {
				'content-type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			}
		}
	);
};
