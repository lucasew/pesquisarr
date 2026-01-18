import { describe, it, expect, beforeEach } from 'vitest';
import TorrentService from './index';
import { createMockEvent } from '../test-utils';

describe('TorrentService', () => {
	let service: TorrentService;

	beforeEach(() => {
		service = new TorrentService(createMockEvent());
	});

	describe('parseMagnet', () => {
		it('should parse a valid magnet link', () => {
			const magnet = 'magnet:?xt=urn:btih:5D41402ABC4B2A76B9719D911017C5924068B73C&dn=test-torrent';
			const result = service.parseMagnet(magnet);
			expect(result).not.toBeNull();
			expect(result?.infoHash).toBe('5D41402ABC4B2A76B9719D911017C5924068B73C');
			expect(result?.title).toBe('test-torrent');
		});

		it('should return null for invalid magnet links', () => {
			expect(service.parseMagnet('not-a-magnet')).toBeNull();
			expect(service.parseMagnet('magnet:?xt=urn:btih:short')).toBeNull();
		});

		it('should handle magnets without dn parameter', () => {
			const magnet = 'magnet:?xt=urn:btih:5D41402ABC4B2A76B9719D911017C5924068B73C';
			const result = service.parseMagnet(magnet);
			expect(result?.infoHash).toBe('5D41402ABC4B2A76B9719D911017C5924068B73C');
			expect(result?.title).toBe('(NO NAME)');
		});
	});
});
