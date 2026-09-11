import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import type { AppEvent } from '../app-event';
import ScraperService, { isLikelyBencode } from './index';
import { createMockEvent } from '../test-utils';

type MockServices = {
	http: { fetch: Mock; getHtml: Mock; getBuffer: Mock };
	torrent: { decodeTorrent: Mock; parseMagnet: Mock };
	imdb: { getTitleById: Mock };
	search: { search: Mock };
	rank: { rank: Mock };
	error: { report: Mock };
};

function mockResponse(opts: {
	contentType: string;
	text?: string;
	buffer?: ArrayBuffer;
}) {
	return {
		ok: true,
		headers: {
			get: (name: string) => (name.toLowerCase() === 'content-type' ? opts.contentType : null)
		},
		text: () => Promise.resolve(opts.text ?? ''),
		arrayBuffer: () => Promise.resolve(opts.buffer ?? new TextEncoder().encode(opts.text ?? '').buffer)
	};
}

describe('isLikelyBencode', () => {
	it('accepts bencode dict / list / int / string prefixes', () => {
		expect(isLikelyBencode(new TextEncoder().encode('d4:infod4:name').buffer)).toBe(true);
		expect(isLikelyBencode(new TextEncoder().encode('l4:spame').buffer)).toBe(true);
		expect(isLikelyBencode(new TextEncoder().encode('i42e').buffer)).toBe(true);
		expect(isLikelyBencode(new TextEncoder().encode('4:spam').buffer)).toBe(true);
	});

	it('rejects HTML (Sentry buffer[0]=60 / "<")', () => {
		expect(isLikelyBencode(new TextEncoder().encode('<!DOCTYPE html><html>').buffer)).toBe(false);
		expect(isLikelyBencode(new TextEncoder().encode('  \n<html>').buffer)).toBe(false);
	});

	it('rejects empty', () => {
		expect(isLikelyBencode(new ArrayBuffer(0))).toBe(false);
	});
});

describe('ScraperService', () => {
	let service: ScraperService;
	let mockEvent: AppEvent;
	let mocks: MockServices;

	beforeEach(() => {
		mockEvent = createMockEvent();
		mocks = {
			http: {
				fetch: vi.fn(),
				getHtml: vi.fn(),
				getBuffer: vi.fn()
			},
			torrent: {
				decodeTorrent: vi.fn(),
				parseMagnet: vi.fn()
			},
			imdb: {
				getTitleById: vi.fn()
			},
			search: {
				search: vi.fn()
			},
			rank: {
				rank: vi.fn((links: string[]) => links)
			},
			error: { report: vi.fn() }
		};
		mockEvent.locals.services = mocks as unknown as typeof mockEvent.locals.services;
		service = new ScraperService(mockEvent);
	});

	describe('fetchTorrentsInSite', () => {
		it('should extract magnets from HTML', async () => {
			const html = 'Some html with magnet:?xt=urn:btih:ABC and magnet:?xt=urn:btih:DEF';
			mocks.http.fetch.mockResolvedValue(
				mockResponse({ contentType: 'text/html', text: html })
			);
			mocks.torrent.parseMagnet.mockImplementation((m: string) => ({
				infoHash: m.split(':').pop(),
				title: 'test'
			}));

			const result = await service.fetchTorrentsInSite('https://example.com');
			expect(result).toHaveLength(2);
			expect(result[0].infoHash).toBe('ABC');
			expect(mocks.torrent.decodeTorrent).not.toHaveBeenCalled();
		});

		it('should not bencode-decode HTML pages that embed an infohash in the URL', async () => {
			// Regression for Sentry #666: buffer[0]=60 ('<') when HTML is fed to bencode
			const hash = '5D41402ABC4B2A76B9719D911017C5924068B73C';
			const html =
				`<html><body>magnet:?xt=urn:btih:${hash}&dn=movie</body></html>`;
			mocks.http.fetch.mockResolvedValue(
				mockResponse({ contentType: 'text/html; charset=utf-8', text: html })
			);
			mocks.torrent.parseMagnet.mockReturnValue({ infoHash: hash, title: 'movie' });

			const result = await service.fetchTorrentsInSite(
				`https://torrent-site.example/torrent/${hash}/details`
			);

			expect(mocks.torrent.decodeTorrent).not.toHaveBeenCalled();
			expect(mocks.torrent.parseMagnet).toHaveBeenCalled();
			expect(result).toEqual([{ infoHash: hash, title: 'movie' }]);
			expect(mocks.error.report).not.toHaveBeenCalled();
		});

		it('should handle .torrent files', async () => {
			const payload = new TextEncoder().encode('d4:infod4:name4:spamee').buffer;
			mocks.http.fetch.mockResolvedValue(
				mockResponse({ contentType: 'application/x-bittorrent', buffer: payload })
			);
			mocks.torrent.decodeTorrent.mockResolvedValue({
				infoHash: 'DECODED',
				title: 'Decoded Torrent'
			});

			const result = await service.fetchTorrentsInSite('https://example.com/file.torrent');
			expect(result).toHaveLength(1);
			expect(result[0].infoHash).toBe('DECODED');
		});

		it('should handle .torrent URLs with query strings', async () => {
			const payload = new TextEncoder().encode('d4:infod4:name4:spamee').buffer;
			mocks.http.fetch.mockResolvedValue(
				mockResponse({ contentType: 'application/octet-stream', buffer: payload })
			);
			mocks.torrent.decodeTorrent.mockResolvedValue({
				infoHash: 'QHASH',
				title: 'Q'
			});

			const result = await service.fetchTorrentsInSite(
				'https://cdn.example.com/dl/file.torrent?token=abc'
			);
			expect(mocks.torrent.decodeTorrent).toHaveBeenCalled();
			expect(result[0].infoHash).toBe('QHASH');
		});

		it('should skip binary decode when body is HTML mislabelled as octet-stream', async () => {
			const html = '<html>magnet:?xt=urn:btih:ABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD</html>';
			mocks.http.fetch.mockResolvedValue(
				mockResponse({ contentType: 'application/octet-stream', text: html })
			);
			mocks.torrent.parseMagnet.mockReturnValue({
				infoHash: 'ABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD',
				title: 'x'
			});

			const result = await service.fetchTorrentsInSite('https://example.com/download');
			expect(mocks.torrent.decodeTorrent).not.toHaveBeenCalled();
			expect(result).toHaveLength(1);
		});

		it('should skip if decodeTorrent fails on real bencode-looking payload', async () => {
			const payload = new TextEncoder().encode('d4:infod4:name4:spamee').buffer;
			mocks.http.fetch.mockResolvedValue(
				mockResponse({ contentType: 'application/x-bittorrent', buffer: payload })
			);
			mocks.torrent.decodeTorrent.mockResolvedValue(null);

			const result = await service.fetchTorrentsInSite('https://example.com/bad.torrent');
			expect(result).toHaveLength(0);
		});
	});

	describe('getTorrentStreams', () => {
		it('should orchestrate the full flow', async () => {
			mocks.imdb.getTitleById.mockResolvedValue('Movie Title');
			mocks.search.search.mockResolvedValue([{ link: 'https://site1.com', source: 'Google' }]);

			vi.spyOn(service, 'fetchTorrentsInSite').mockResolvedValue([
				{ infoHash: 'HASH1', title: 'Title 1' }
			]);

			const result = await service.getTorrentStreams('tt1234567');
			expect(result).toHaveLength(1);
			expect(result[0].infoHash).toBe('HASH1');
			expect(service.fetchTorrentsInSite).toHaveBeenCalledWith(
				'https://site1.com',
				'https://www.google.com/'
			);
		});
	});
});
