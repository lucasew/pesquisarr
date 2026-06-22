import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import type { AppEvent } from '../app-event';
import ScraperService from './index';
import { createMockEvent } from '../test-utils';

type MockServices = {
	http: { fetch: Mock; getHtml: Mock; getBuffer: Mock };
	torrent: { decodeTorrent: Mock; parseMagnet: Mock };
	imdb: { getTitleById: Mock };
	search: { search: Mock };
	rank: { rank: Mock };
	error: { report: Mock };
};

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
			mocks.http.fetch.mockResolvedValue({
				ok: true,
				headers: new Map([['Content-Type', 'text/html']]),
				text: () => Promise.resolve(html)
			});
			mocks.torrent.parseMagnet.mockImplementation((m: string) => ({
				infoHash: m.split(':').pop(),
				title: 'test'
			}));

			const result = await service.fetchTorrentsInSite('https://example.com');
			expect(result).toHaveLength(2);
			expect(result[0].infoHash).toBe('ABC');
		});

		it('should handle .torrent files', async () => {
			mocks.http.fetch.mockResolvedValue({
				ok: true,
				headers: new Map([['Content-Type', 'application/x-bittorrent']]),
				arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
			});
			mocks.torrent.decodeTorrent.mockResolvedValue({
				infoHash: 'DECODED',
				title: 'Decoded Torrent'
			});

			const result = await service.fetchTorrentsInSite('https://example.com/file.torrent');
			expect(result).toHaveLength(1);
			expect(result[0].infoHash).toBe('DECODED');
		});

		it('should skip if decodeTorrent fails', async () => {
			mocks.http.fetch.mockResolvedValue({
				ok: true,
				headers: new Map([['Content-Type', 'application/x-bittorrent']]),
				arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
			});
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
