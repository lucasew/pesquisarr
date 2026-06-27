import { handleStremioStream } from '$lib/server/stremio/stream';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals, request, url }) => {
	const platform = (locals as unknown as { runtime?: { env?: Record<string, unknown> } }).runtime
		? { env: (locals as unknown as { runtime: { env?: Record<string, unknown> } }).runtime.env }
		: undefined;

	return handleStremioStream({
		params: params as Record<string, string | undefined>,
		locals,
		request,
		url,
		platform
	});
};
