import { describe, it, expect, beforeEach } from 'vitest';
import TorrentService from './index';
import { createMockEvent } from '../test-utils';

describe('TorrentService XSS', () => {
	let service: TorrentService;

	beforeEach(() => {
		service = new TorrentService(createMockEvent());
	});

	describe('parseMagnet XSS', () => {
		it('should return sanitized title when XSS is attempted', () => {
			const xssTitle = '<script>alert(1)</script>';
			const magnet = `magnet:?xt=urn:btih:5D41402ABC4B2A76B9719D911017C5924068B73C&dn=${encodeURIComponent(xssTitle)}`;
			const result = service.parseMagnet(magnet);
			expect(result).not.toBeNull();
			// HTML encoded entities
			expect(result?.title).toBe('&#x3C;script&#x3E;alert(1)&#x3C;/script&#x3E;');
		});

		it('should sanitize title but keep safe content', () => {
			const mixedTitle = 'Safe <script>alert(1)</script> Content';
			const magnet = `magnet:?xt=urn:btih:5D41402ABC4B2A76B9719D911017C5924068B73C&dn=${encodeURIComponent(mixedTitle)}`;
			const result = service.parseMagnet(magnet);
			expect(result).not.toBeNull();
			expect(result?.title).toBe('Safe &#x3C;script&#x3E;alert(1)&#x3C;/script&#x3E; Content');
		});
	});
});
