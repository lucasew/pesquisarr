import type { APIRoute } from 'astro';
import { handleMcpRequestWithCors } from '$lib/server/mcp';

/**
 * Stateless MCP endpoint (Streamable HTTP).
 *
 * Point MCP clients at `/api/mcp`. Each request builds a fresh server; there is
 * no session state to lose between Worker isolates.
 */
const handle: APIRoute = ({ request, locals }) =>
	handleMcpRequestWithCors(request, locals.services);

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
export const OPTIONS = handle;
