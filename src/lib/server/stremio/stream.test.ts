import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
	parseStremioVideoId,
	preferEpisodeStreams,
	episodeNameTags,
	handleStremioStream
} from './stream';
import { createMockEvent } from '../services/test-utils';
import type { AppEvent } from '../app-event';
import type { TorrentStream } from '../services/torrent';

describe('parseStremioVideoId', () => {
	it('accepts bare movie ids', () => {
		expect(parseStremioVideoId('tt0111161')).toEqual({ imdbId: 'tt0111161' });
		expect(parseStremioVideoId('tt123456789012')).toEqual({ imdbId: 'tt123456789012' });
	});

	it('strips the Stremio .json resource suffix', () => {
		expect(parseStremioVideoId('tt0111161.json')).toEqual({ imdbId: 'tt0111161' });
		expect(parseStremioVideoId('tt0111161.JSON')).toEqual({ imdbId: 'tt0111161' });
	});

	it('parses series season/episode ids', () => {
		expect(parseStremioVideoId('tt0944947:1:1')).toEqual({
			imdbId: 'tt0944947',
			season: 1,
			episode: 1
		});
		expect(parseStremioVideoId('tt0944947:2:10')).toEqual({
			imdbId: 'tt0944947',
			season: 2,
			episode: 10
		});
		expect(parseStremioVideoId('tt0944947:1:1.json')).toEqual({
			imdbId: 'tt0944947',
			season: 1,
			episode: 1
		});
	});

	it('keeps base id when season/episode are incomplete or invalid', () => {
		// Missing episode segment — still a usable show-level id
		expect(parseStremioVideoId('tt0944947:1')).toEqual({ imdbId: 'tt0944947' });
		expect(parseStremioVideoId('tt0944947:0:1')).toEqual({ imdbId: 'tt0944947' });
		expect(parseStremioVideoId('tt0944947:1:0')).toEqual({ imdbId: 'tt0944947' });
	});

	it('decodes URL-encoded colons and suffixes', () => {
		expect(parseStremioVideoId('tt0944947%3A1%3A2')).toEqual({
			imdbId: 'tt0944947',
			season: 1,
			episode: 2
		});
		expect(parseStremioVideoId('tt0111161%2Ejson')).toEqual({ imdbId: 'tt0111161' });
	});

	it('rejects junk and incomplete ids', () => {
		expect(parseStremioVideoId('')).toBeNull();
		expect(parseStremioVideoId('not-an-id')).toBeNull();
		expect(parseStremioVideoId('tt123')).toBeNull(); // too short
		expect(parseStremioVideoId('nm0111161')).toBeNull();
		expect(parseStremioVideoId(':1:1')).toBeNull();
	});
});

describe('episodeNameTags', () => {
	it('builds common torrent naming tags', () => {
		expect(episodeNameTags(1, 5)).toEqual(['S01E05', 'S1E5', '1x05', '1x5']);
	});
});

describe('preferEpisodeStreams', () => {
	const streams: TorrentStream[] = [
		{ infoHash: 'A', title: 'Show.S02E01.720p' },
		{ infoHash: 'B', title: 'Show.S01E05.1080p' },
		{ infoHash: 'C', title: 'Show Season Pack' }
	];

	it('moves matching episode titles first', () => {
		const ranked = preferEpisodeStreams(streams, 1, 5);
		expect(ranked.map((s) => s.infoHash)).toEqual(['B', 'A', 'C']);
	});

	it('leaves order alone when nothing matches', () => {
		const ranked = preferEpisodeStreams(streams, 9, 9);
		expect(ranked.map((s) => s.infoHash)).toEqual(['A', 'B', 'C']);
	});

	it('matches unpadded tags like 1x5', () => {
		const withUnpadded: TorrentStream[] = [
			{ infoHash: 'X', title: 'Show.1x5.WEB' },
			{ infoHash: 'Y', title: 'Show.S02E01' }
		];
		expect(preferEpisodeStreams(withUnpadded, 1, 5).map((s) => s.infoHash)).toEqual([
			'X',
			'Y'
		]);
	});
});

describe('handleStremioStream', () => {
	let event: AppEvent;
	let getTorrentStreams: Mock;

	beforeEach(() => {
		event = createMockEvent();
		getTorrentStreams = vi.fn().mockResolvedValue([{ infoHash: 'ABC', title: 't' }]);
		event.locals.services = {
			scraper: { getTorrentStreams }
		} as unknown as typeof event.locals.services;
	});

	it('resolves series video ids to streams', async () => {
		event.params = { name: 'tt0944947:1:1.json' };
		const res = await handleStremioStream(event);
		expect(res.status).toBe(200);
		expect(getTorrentStreams).toHaveBeenCalledWith('tt0944947');
		const body = await res.json();
		expect(body.streams).toHaveLength(1);
	});

	it('prefers torrent titles that match the requested episode', async () => {
		getTorrentStreams.mockResolvedValue([
			{ infoHash: 'PACK', title: 'Show Complete' },
			{ infoHash: 'EP', title: 'Show.S01E02.mkv' }
		]);
		event.params = { name: 'tt0944947:1:2.json' };
		const res = await handleStremioStream(event);
		expect(getTorrentStreams).toHaveBeenCalledWith('tt0944947');
		const body = await res.json();
		expect(body.streams.map((s: TorrentStream) => s.infoHash)).toEqual(['EP', 'PACK']);
	});

	it('returns 400 for invalid ids', async () => {
		event.params = { name: 'garbage' };
		const res = await handleStremioStream(event);
		expect(res.status).toBe(400);
		expect(getTorrentStreams).not.toHaveBeenCalled();
	});
});
