import { handleStremioStream } from '$lib/server/stremio/stream';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = handleStremioStream;
