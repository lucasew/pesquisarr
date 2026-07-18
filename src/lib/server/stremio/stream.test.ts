import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { parseStremioVideoId, handleStremioStream } from './stream';
import { createMockEvent } from '../services/test-utils';
import type { AppEvent } from '../app-event';

describe('parseStremioVideoId', () => {
	it('accepts bare movie ids', () => {
		expect(parseStremioVideoId('tt0111161')).toBe('tt0111161');
		expect(parseStremioVideoId('tt123456789012')).toBe('tt123456789012');
	});

	it('strips the Stremio .json resource suffix', () => {
		expect(parseStremioVideoId('tt0111161.json')).toBe('tt0111161');
		expect(parseStremioVideoId('tt0111161.JSON')).toBe('tt0111161');
	});

	it('extracts the base id from series season/episode ids', () => {
		expect(parseStremioVideoId('tt0944947:1:1')).toBe('tt0944947');
		expect(parseStremioVideoId('tt0944947:2:10')).toBe('tt0944947');
		expect(parseStremioVideoId('tt0944947:1:1.json')).toBe('tt0944947');
	});

	it('decodes URL-encoded colons and suffixes', () => {
		expect(parseStremioVideoId('tt0944947%3A1%3A2')).toBe('tt0944947');
		expect(parseStremioVideoId('tt0111161%2Ejson')).toBe('tt0111161');
	});

	it('rejects junk and incomplete ids', () => {
		expect(parseStremioVideoId('')).toBeNull();
		expect(parseStremioVideoId('not-an-id')).toBeNull();
		expect(parseStremioVideoId('tt123')).toBeNull(); // too short
		expect(parseStremioVideoId('nm0111161')).toBeNull();
		expect(parseStremioVideoId(':1:1')).toBeNull();
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

	it('returns 400 for invalid ids', async () => {
		event.params = { name: 'garbage' };
		const res = await handleStremioStream(event);
		expect(res.status).toBe(400);
		expect(getTorrentStreams).not.toHaveBeenCalled();
	});
});
