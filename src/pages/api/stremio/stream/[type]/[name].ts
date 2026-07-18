import { handleStremioStream } from '$lib/server/stremio/stream';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals, request, url }) => {
	return handleStremioStream({
		params: params as Record<string, string | undefined>,
		locals,
		request,
		url
	});
};
