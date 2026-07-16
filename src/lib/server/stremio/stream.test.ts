import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
	parseStremioResourceId,
	preferEpisodeStreams,
	episodeNameTags,
	handleStremioStream
} from './stream';
import { createMockEvent } from '../services/test-utils';
import type { TorrentStream } from '../services/torrent';

describe('parseStremioResourceId', () => {
	it('accepts bare movie ids', () => {
		expect(parseStremioResourceId('tt0111161')).toEqual({ imdbId: 'tt0111161' });
	});

	it('strips the Stremio .json suffix', () => {
		expect(parseStremioResourceId('tt0111161.json')).toEqual({ imdbId: 'tt0111161' });
		expect(parseStremioResourceId('tt0111161.JSON')).toEqual({ imdbId: 'tt0111161' });
	});

	it('parses series season/episode ids', () => {
		expect(parseStremioResourceId('tt0944947:1:5')).toEqual({
			imdbId: 'tt0944947',
			season: 1,
			episode: 5
		});
		expect(parseStremioResourceId('tt0944947:1:5.json')).toEqual({
			imdbId: 'tt0944947',
			season: 1,
			episode: 5
		});
	});

	it('rejects invalid shapes', () => {
		expect(parseStremioResourceId('')).toBeNull();
		expect(parseStremioResourceId('tt123')).toBeNull(); // too short
		expect(parseStremioResourceId('not-an-id')).toBeNull();
		expect(parseStremioResourceId('tt0111161:1')).toBeNull(); // missing episode
		expect(parseStremioResourceId('tt0111161:0:1')).toBeNull(); // season < 1
		expect(parseStremioResourceId('tt0111161:1:0')).toBeNull(); // episode < 1
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
});

describe('handleStremioStream', () => {
	let getTorrentStreams: Mock;

	beforeEach(() => {
		getTorrentStreams = vi.fn();
	});

	function eventWith(name: string) {
		const event = createMockEvent();
		event.params = { name };
		event.locals.services = {
			...event.locals.services,
			scraper: { getTorrentStreams }
		} as unknown as App.Locals['services'];
		return event;
	}

	it('returns 400 for ids that are not IMDb/Stremio shaped', async () => {
		const res = await handleStremioStream(eventWith('nope'));
		expect(res.status).toBe(400);
		expect(getTorrentStreams).not.toHaveBeenCalled();
	});

	it('looks up streams with the bare IMDb id when .json is present', async () => {
		getTorrentStreams.mockResolvedValue([{ infoHash: 'H', title: 'Movie' }]);
		const res = await handleStremioStream(eventWith('tt0111161.json'));
		expect(res.status).toBe(200);
		expect(getTorrentStreams).toHaveBeenCalledWith('tt0111161');
		const body = await res.json();
		expect(body.streams).toEqual([{ infoHash: 'H', title: 'Movie' }]);
	});

	it('uses base IMDb id for series episode requests and prefers matching titles', async () => {
		getTorrentStreams.mockResolvedValue([
			{ infoHash: 'PACK', title: 'Show Complete' },
			{ infoHash: 'EP', title: 'Show.S01E02.mkv' }
		]);
		const res = await handleStremioStream(eventWith('tt0944947:1:2.json'));
		expect(getTorrentStreams).toHaveBeenCalledWith('tt0944947');
		const body = await res.json();
		expect(body.streams.map((s: TorrentStream) => s.infoHash)).toEqual(['EP', 'PACK']);
	});
});
