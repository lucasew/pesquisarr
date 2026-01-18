import { describe, it, expect, beforeEach } from 'vitest';
import RankService from './index';
import { createMockEvent } from '../test-utils';

describe('RankService', () => {
	let service: RankService;

	beforeEach(() => {
		service = new RankService(createMockEvent());
	});

	it('should check if a link is ignored', () => {
		expect(service.isIgnored('https://youtube.com/something')).toBe(true);
		expect(service.isIgnored('https://example.com/torrent')).toBe(false);
	});

	it('should rank a list of links', () => {
		const links = [
			'https://youtube.com/watch?v=123',
			'https://example.com/movie',
			'https://example.com/movie-torrent-download'
		];
		const result = service.rank(links);
		expect(result).toHaveLength(2);
		expect(result[0]).toBe('https://example.com/movie-torrent-download');
		expect(result).not.toContain('https://youtube.com/watch?v=123');
	});
});
