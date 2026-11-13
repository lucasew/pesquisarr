import { isValidHttpUrl } from '$lib/url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { CfWorkerJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/cfworker-provider.js';
import * as z from 'zod/v4';
import packagejson from '../../../../package.json';
import type { getServices } from '../services';
import { REGEX_IMDB_ID } from '../services/imdb';
import { buildMagnetLink, type TorrentStream } from '../services/torrent';
import { preferEpisodeStreams } from '../stremio/stream';

type Services = ReturnType<typeof getServices>;

export const MCP_SERVER_NAME = 'pesquisarr';
export const MCP_SERVER_VERSION: string = packagejson.version;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/** CORS headers required by browser-based MCP clients (Inspector, web UIs). */
export const MCP_CORS_HEADERS: Record<string, string> = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
	'Access-Control-Allow-Headers':
		'Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID',
	'Access-Control-Expose-Headers': 'Mcp-Session-Id, Mcp-Protocol-Version'
};

function textResult(data: unknown) {
	return {
		content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }]
	};
}

function errorResult(message: string) {
	return {
		content: [{ type: 'text' as const, text: message }],
		isError: true
	};
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

/** Shape torrents for MCP clients: infohash/title/trackers plus a ready-to-use magnet URI. */
function serializeStream(stream: TorrentStream) {
	return {
		infoHash: stream.infoHash,
		title: stream.title,
		trackers: stream.trackers,
		magnet: buildMagnetLink(stream)
	};
}

function limitStreams(streams: TorrentStream[], limit: number | undefined) {
	const capped = Math.min(limit ?? DEFAULT_LIMIT, MAX_LIMIT);
	return streams.slice(0, capped);
}

/**
 * Build the MCP server for one request.
 *
 * Stateless Streamable HTTP: a fresh McpServer/transport pair is created per
 * request, so no session state has to survive between Cloudflare Workers
 * isolates. `CfWorkerJsonSchemaValidator` avoids Ajv code generation
 * (`new Function`), which Workers disallow.
 */
export function createMcpServer(services: Services): McpServer {
	const server = new McpServer(
		{ name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
		{
			jsonSchemaValidator: new CfWorkerJsonSchemaValidator(),
			instructions:
				'Search public torrent indexers, resolve IMDb ids to torrent streams, and extract magnets ' +
				'from a specific page URL. Results include an infoHash, a display title, trackers, and a magnet URI.'
		}
	);

	server.registerTool(
		'search_torrents',
		{
			title: 'Search torrents',
			description:
				'Search torrent indexers on the web for a title or keyword. ' +
				'Returns deduplicated torrents (infoHash, title, trackers, magnet URI). ' +
				'This can take a few seconds because it fetches and scrapes result pages.',
			inputSchema: {
				query: z.string().min(1).describe('Title or keywords to search for'),
				limit: z
					.number()
					.int()
					.min(1)
					.max(MAX_LIMIT)
					.optional()
					.describe(`Maximum results to return (default ${DEFAULT_LIMIT}, max ${MAX_LIMIT})`)
			}
		},
		async ({ query, limit }) => {
			try {
				const streams = await services.search.searchAndScrape(query);
				const selected = limitStreams(streams, limit);
				return textResult({
					query,
					total: streams.length,
					returned: selected.length,
					streams: selected.map(serializeStream)
				});
			} catch (e) {
				services.error.report(e, { tool: 'search_torrents', query });
				return errorResult(`Torrent search failed: ${errorMessage(e)}`);
			}
		}
	);

	server.registerTool(
		'get_torrent_streams',
		{
			title: 'Get torrent streams by IMDb id',
			description:
				'Resolve an IMDb title (tt…) to torrent streams. Optionally pass season and ' +
				'episode to sort streams that match an episode tag (S01E02) first.',
			inputSchema: {
				imdbId: z.string().describe('IMDb id in the form tt0111161'),
				season: z.number().int().min(1).optional().describe('Season number (series only)'),
				episode: z.number().int().min(1).optional().describe('Episode number (series only)'),
				limit: z
					.number()
					.int()
					.min(1)
					.max(MAX_LIMIT)
					.optional()
					.describe(`Maximum results to return (default ${DEFAULT_LIMIT}, max ${MAX_LIMIT})`)
			}
		},
		async ({ imdbId, season, episode, limit }) => {
			if (!REGEX_IMDB_ID.test(imdbId)) {
				return errorResult(`Invalid IMDb id "${imdbId}". Expected tt followed by 7-12 digits.`);
			}
			if ((season === undefined) !== (episode === undefined)) {
				return errorResult('Provide both season and episode, or neither.');
			}
			try {
				let streams = await services.scraper.getTorrentStreams(imdbId);
				if (season !== undefined && episode !== undefined) {
					streams = preferEpisodeStreams(streams, season, episode);
				}
				const selected = limitStreams(streams, limit);
				return textResult({
					imdbId,
					season,
					episode,
					total: streams.length,
					returned: selected.length,
					streams: selected.map(serializeStream)
				});
			} catch (e) {
				services.error.report(e, { tool: 'get_torrent_streams', imdbId });
				return errorResult(`Could not resolve torrent streams: ${errorMessage(e)}`);
			}
		}
	);

	server.registerTool(
		'extract_magnets_from_url',
		{
			title: 'Extract magnets from a page URL',
			description:
				'Fetch one page without running JavaScript and return the magnet links it contains. ' +
				'Accepts an indexer detail page or a direct .torrent URL. ' +
				'Use it when you already have the link and do not want a web search.',
			inputSchema: {
				url: z.string().min(1).describe('Page or .torrent URL to scrape (http/https)'),
				referer: z
					.string()
					.optional()
					.describe('Optional Referer header for sites that block direct requests'),
				limit: z
					.number()
					.int()
					.min(1)
					.max(MAX_LIMIT)
					.optional()
					.describe(`Maximum results to return (default ${DEFAULT_LIMIT}, max ${MAX_LIMIT})`)
			}
		},
		async ({ url, referer, limit }) => {
			if (!isValidHttpUrl(url)) {
				return errorResult(`Invalid URL "${url}". Expected a public http or https URL.`);
			}
			try {
				const streams = await services.scraper.fetchTorrentsInSite(url, referer);
				const selected = limitStreams(streams, limit);
				return textResult({
					url,
					total: streams.length,
					returned: selected.length,
					streams: selected.map(serializeStream)
				});
			} catch (e) {
				services.error.report(e, { tool: 'extract_magnets_from_url', url });
				return errorResult(`Could not extract magnets from ${url}: ${errorMessage(e)}`);
			}
		}
	);

	server.registerTool(
		'get_imdb_title',
		{
			title: 'Get IMDb title',
			description: 'Fetch the display title for an IMDb id (tt…). Useful before searching.',
			inputSchema: {
				imdbId: z.string().describe('IMDb id in the form tt0111161')
			}
		},
		async ({ imdbId }) => {
			if (!REGEX_IMDB_ID.test(imdbId)) {
				return errorResult(`Invalid IMDb id "${imdbId}". Expected tt followed by 7-12 digits.`);
			}
			try {
				const title = await services.imdb.getTitleById(imdbId);
				// getTitleById falls back to the raw id when the fetch or parse fails.
				if (title === imdbId) {
					return errorResult(`Could not find an IMDb title for ${imdbId}.`);
				}
				return textResult({ imdbId, title });
			} catch (e) {
				services.error.report(e, { tool: 'get_imdb_title', imdbId });
				return errorResult(`IMDb lookup failed: ${errorMessage(e)}`);
			}
		}
	);

	server.registerTool(
		'health_check',
		{
			title: 'Health check',
			description:
				'Check service health. Shallow by default (no network calls); pass deep=true ' +
				'to probe the search engines and IMDb.',
			inputSchema: {
				deep: z
					.boolean()
					.optional()
					.describe('Run network checks against the upstream search engines and IMDb')
			}
		},
		async ({ deep }) => {
			const checks = deep
				? await Promise.all([
						services.torrent.healthCheck(),
						services.search_google.healthCheck(),
						services.search_duckduckgo.healthCheck(),
						services.search_yandex.healthCheck(),
						services.imdb.healthCheck(),
						services.error.healthCheck()
					])
				: await Promise.all([services.error.healthCheck()]);
			return textResult({
				ok: checks.every((check) => check.ok),
				deep: Boolean(deep),
				checks
			});
		}
	);

	return server;
}

/**
 * Handle one stateless MCP request over Streamable HTTP.
 *
 * JSON responses (instead of SSE) keep request/response bounded, which fits
 * Workers and serverless runtimes.
 */
export async function handleMcpRequest(request: Request, services: Services): Promise<Response> {
	const server = createMcpServer(services);
	const transport = new WebStandardStreamableHTTPServerTransport({
		enableJsonResponse: true
	});
	await server.connect(transport);
	return transport.handleRequest(request);
}

/** Run a request and add CORS headers to every response, including JSON-RPC errors. */
export async function handleMcpRequestWithCors(
	request: Request,
	services: Services
): Promise<Response> {
	if (request.method === 'OPTIONS') {
		return new Response(null, { status: 204, headers: MCP_CORS_HEADERS });
	}

	const response = await handleMcpRequest(request, services);
	const headers = new Headers(response.headers);
	for (const [name, value] of Object.entries(MCP_CORS_HEADERS)) {
		headers.set(name, value);
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}
