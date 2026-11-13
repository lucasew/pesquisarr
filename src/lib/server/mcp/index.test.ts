import { describe, expect, it, vi } from 'vitest';
import { createMcpServer, handleMcpRequest, MCP_SERVER_NAME } from './index';
import type { TorrentStream } from '../services/torrent';

const sampleStream: TorrentStream = {
	infoHash: '0123456789ABCDEF0123456789ABCDEF01234567',
	title: 'The Shawshank Redemption 1994 1080p',
	trackers: ['udp://tracker.example:1337/announce']
};

function makeServices() {
	return {
		search: {
			searchAndScrape: vi.fn(async () => [sampleStream])
		},
		scraper: {
			getTorrentStreams: vi.fn(async () => [sampleStream]),
			fetchTorrentsInSite: vi.fn(async () => [sampleStream])
		},
		imdb: {
			getTitleById: vi.fn(async () => 'The Shawshank Redemption')
		},
		torrent: { healthCheck: vi.fn(async () => ({ ok: true })) },
		search_google: { healthCheck: vi.fn(async () => ({ ok: true })) },
		search_duckduckgo: { healthCheck: vi.fn(async () => ({ ok: true })) },
		search_yandex: { healthCheck: vi.fn(async () => ({ ok: true })) },
		error: {
			report: vi.fn(),
			healthCheck: vi.fn(async () => ({ ok: true }))
		}
	};
}

type Services = ReturnType<typeof makeServices>;

type JsonRpcResponse = {
	result?: {
		serverInfo?: { name?: string };
		capabilities?: Record<string, unknown>;
		tools?: Array<{ name: string }>;
		content?: Array<{ text?: string }>;
		isError?: boolean;
	};
	error?: { message?: string };
};

async function rpc(services: Services, body: unknown): Promise<JsonRpcResponse> {
	const request = new Request('http://localhost/api/mcp', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			accept: 'application/json, text/event-stream'
		},
		body: JSON.stringify(body)
	});
	const response = await handleMcpRequest(request, services as never);
	expect(response.status).toBe(200);
	return response.json() as Promise<JsonRpcResponse>;
}

const initializeRequest = {
	jsonrpc: '2.0',
	id: 1,
	method: 'initialize',
	params: {
		protocolVersion: '2025-06-18',
		capabilities: {},
		clientInfo: { name: 'vitest', version: '0.0.0' }
	}
};

describe('MCP server', () => {
	it('answers initialize with server info and tools capability', async () => {
		const services = makeServices();
		const body = await rpc(services, initializeRequest);

		expect(body.result?.serverInfo?.name).toBe(MCP_SERVER_NAME);
		expect(body.result?.capabilities?.tools).toBeDefined();
	});

	it('lists the torrent and IMDb tools', async () => {
		const services = makeServices();
		const body = await rpc(services, { jsonrpc: '2.0', id: 2, method: 'tools/list' });

		const names = (body.result?.tools ?? []).map((tool) => tool.name);
		expect(names).toEqual(
			expect.arrayContaining([
				'search_torrents',
				'get_torrent_streams',
				'extract_magnets_from_url',
				'get_imdb_title',
				'health_check'
			])
		);
	});

	it('runs search_torrents and returns magnet links', async () => {
		const services = makeServices();
		const body = await rpc(services, {
			jsonrpc: '2.0',
			id: 3,
			method: 'tools/call',
			params: { name: 'search_torrents', arguments: { query: 'shawshank', limit: 5 } }
		});

		expect(services.search.searchAndScrape).toHaveBeenCalledWith('shawshank');
		const payload = JSON.parse(body.result?.content?.[0]?.text ?? '{}');
		expect(payload.total).toBe(1);
		expect(payload.streams[0].infoHash).toBe(sampleStream.infoHash);
		expect(payload.streams[0].magnet).toContain('magnet:?xt=urn:btih:');
	});

	it('extracts magnets from a page URL without a search', async () => {
		const services = makeServices();
		const body = await rpc(services, {
			jsonrpc: '2.0',
			id: 4,
			method: 'tools/call',
			params: {
				name: 'extract_magnets_from_url',
				arguments: { url: 'https://indexer.example/torrent/abc', limit: 5 }
			}
		});

		expect(services.scraper.fetchTorrentsInSite).toHaveBeenCalledWith(
			'https://indexer.example/torrent/abc',
			undefined
		);
		const payload = JSON.parse(body.result?.content?.[0]?.text ?? '{}');
		expect(payload.total).toBe(1);
		expect(payload.streams[0].magnet).toContain('magnet:?xt=urn:btih:');
	});

	it('rejects a non-public URL without fetching it', async () => {
		const services = makeServices();
		const body = await rpc(services, {
			jsonrpc: '2.0',
			id: 5,
			method: 'tools/call',
			params: { name: 'extract_magnets_from_url', arguments: { url: 'http://127.0.0.1/admin' } }
		});

		expect(body.result?.isError).toBe(true);
		expect(services.scraper.fetchTorrentsInSite).not.toHaveBeenCalled();
	});

	it('rejects an invalid IMDb id without hitting the scraper', async () => {
		const services = makeServices();
		const body = await rpc(services, {
			jsonrpc: '2.0',
			id: 4,
			method: 'tools/call',
			params: { name: 'get_torrent_streams', arguments: { imdbId: 'not-an-id' } }
		});

		expect(body.result?.isError).toBe(true);
		expect(services.scraper.getTorrentStreams).not.toHaveBeenCalled();
	});

	it('resolves an IMDb title', async () => {
		const services = makeServices();
		const body = await rpc(services, {
			jsonrpc: '2.0',
			id: 5,
			method: 'tools/call',
			params: { name: 'get_imdb_title', arguments: { imdbId: 'tt0111161' } }
		});

		const payload = JSON.parse(body.result?.content?.[0]?.text ?? '{}');
		expect(payload.title).toBe('The Shawshank Redemption');
	});

	it('registers every tool on the high-level server', () => {
		// Smoke test the factory itself, independent of the transport.
		const server = createMcpServer(makeServices() as never);
		expect(server).toBeDefined();
	});
});
