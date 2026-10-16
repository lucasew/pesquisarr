import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import type { AppEvent } from '../../app-event';
import SearchService, { mergeStreamsByInfoHash, SOURCE_REFERERS } from './index';
import { HttpFetchError } from '../http';
import { createMockEvent } from '../test-utils';
import type { TorrentStream } from '../torrent';

type MockServices = {
	search_google: { search: Mock };
	search_duckduckgo: { search: Mock };
	search_yandex: { search: Mock };
	rank: { rank: Mock };
	scraper: { fetchTorrentsInSite: Mock };
	error: { report: Mock; warn: Mock };
};

describe('mergeStreamsByInfoHash', () => {
	it('unions trackers when the same infoHash appears twice', () => {
		const a: TorrentStream = {
			infoHash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
			title: 'A',
			trackers: ['http://t1.example/announce']
		};
		const b: TorrentStream = {
			infoHash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
			title: 'B',
			trackers: ['http://t1.example/announce', 'http://t2.example/announce']
		};
		const merged = mergeStreamsByInfoHash([a, b]);
		expect(merged).toHaveLength(1);
		expect(merged[0].trackers).toEqual([
			'http://t1.example/announce',
			'http://t2.example/announce'
		]);
		// First title wins (stable for UI).
		expect(merged[0].title).toBe('A');
	});
});

describe('SearchService.scrapeResults / searchAndScrape', () => {
	let service: SearchService;
	let mockEvent: AppEvent;
	let mocks: MockServices;

	beforeEach(() => {
		mockEvent = createMockEvent();
		mocks = {
			search_google: { search: vi.fn().mockResolvedValue([]) },
			search_duckduckgo: { search: vi.fn().mockResolvedValue([]) },
			search_yandex: { search: vi.fn().mockResolvedValue([]) },
			rank: { rank: vi.fn((links: string[]) => links) },
			scraper: { fetchTorrentsInSite: vi.fn().mockResolvedValue([]) },
			error: { report: vi.fn(), warn: vi.fn() }
		};
		mockEvent.locals.services = {
			...((mockEvent.locals.services as object) ?? {}),
			...mocks
		} as unknown as typeof mockEvent.locals.services;
		service = new SearchService(mockEvent);
	});

	it('ranks, scrapes with engine referers, and merges streams', async () => {
		const searchResults = [
			{ link: 'https://site1.example/t', source: 'Google' },
			{ link: 'https://site2.example/t', source: 'Yandex' }
		];
		mocks.scraper.fetchTorrentsInSite
			.mockResolvedValueOnce([
				{
					infoHash: 'hash1hash1hash1hash1hash1hash1hash1hash1',
					title: 'One',
					trackers: ['http://a.example/announce']
				}
			])
			.mockResolvedValueOnce([
				{
					infoHash: 'HASH1HASH1HASH1HASH1HASH1HASH1HASH1HASH1',
					title: 'One-again',
					trackers: ['http://b.example/announce']
				}
			]);

		const streams = await service.scrapeResults(searchResults);

		expect(mocks.rank.rank).toHaveBeenCalledWith([
			'https://site1.example/t',
			'https://site2.example/t'
		]);
		expect(mocks.scraper.fetchTorrentsInSite).toHaveBeenCalledWith(
			'https://site1.example/t',
			SOURCE_REFERERS.Google
		);
		expect(mocks.scraper.fetchTorrentsInSite).toHaveBeenCalledWith(
			'https://site2.example/t',
			SOURCE_REFERERS.Yandex
		);
		expect(streams).toHaveLength(1);
		expect(streams[0].trackers).toEqual(['http://a.example/announce', 'http://b.example/announce']);
	});

	it('searchAndScrape runs engines then scrapeResults', async () => {
		mocks.search_google.search.mockResolvedValue([
			{ link: 'https://only.example', source: 'Google' }
		]);
		mocks.scraper.fetchTorrentsInSite.mockResolvedValue([
			{
				infoHash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
				title: 'T',
				trackers: []
			}
		]);

		const streams = await service.searchAndScrape('movie');
		expect(mocks.search_google.search).toHaveBeenCalled();
		expect(streams).toHaveLength(1);
		expect(streams[0].infoHash).toBe('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
	});

	it('returns the other engines when one source is rate limited', async () => {
		mocks.search_google.search.mockRejectedValue(
			new HttpFetchError({
				kind: 'HTML',
				url: 'https://example.test/search?q=movie',
				status: 429,
				statusText: 'Too Many Requests'
			})
		);
		mocks.search_duckduckgo.search.mockResolvedValue([
			{ link: 'https://ddg.example/a', source: 'DuckDuckGo' }
		]);
		mocks.search_yandex.search.mockRejectedValue(
			new HttpFetchError({
				kind: 'HTML',
				url: 'https://example.test/search?q=movie',
				cause: new Error('Network connection lost.')
			})
		);

		const results = await service.search('movie');

		expect(results).toEqual([{ link: 'https://ddg.example/a', source: 'DuckDuckGo' }]);
		expect(mocks.error.report).not.toHaveBeenCalled();
		expect(mocks.error.warn).toHaveBeenCalledTimes(2);
	});

	it('reports an unexpected engine failure without dropping the others', async () => {
		mocks.search_google.search.mockRejectedValue(new Error('result parse failed'));
		mocks.search_duckduckgo.search.mockResolvedValue([
			{ link: 'https://ddg.example/a', source: 'DuckDuckGo' }
		]);

		const results = await service.search('movie');

		expect(results).toEqual([{ link: 'https://ddg.example/a', source: 'DuckDuckGo' }]);
		expect(mocks.error.report).toHaveBeenCalledWith(
			expect.any(Error),
			expect.objectContaining({ message: 'google search failed' })
		);
		expect(mocks.error.warn).not.toHaveBeenCalled();
	});
});
