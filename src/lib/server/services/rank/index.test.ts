import { describe, it, expect, beforeEach } from 'vitest';
import RankService, { buildIgnoredDomainRegex, escapeRegExp } from './index';
import { createMockEvent } from '../test-utils';

describe('escapeRegExp / buildIgnoredDomainRegex', () => {
	it('escapes regex metacharacters so dots match literally', () => {
		expect(escapeRegExp('youtube.com')).toBe('youtube\\.com');
		const re = buildIgnoredDomainRegex(['youtube.com', 'archive.org']);
		expect(re.test('https://youtube.com/watch')).toBe(true);
		expect(re.test('https://www.youtube.com/v')).toBe(true);
		// Unescaped `.` would treat "any char" and match these false positives:
		expect(re.test('https://youtubexcom.evil/x')).toBe(false);
		expect(re.test('https://not-youtube-com.example')).toBe(false);
		expect(re.test('https://archivexorg.evil')).toBe(false);
		expect(re.test('https://archive.org/details/x')).toBe(true);
	});

	it('still allows intentional keyword substrings like proxy', () => {
		const re = buildIgnoredDomainRegex(['proxy', 'vpn']);
		expect(re.test('https://someproxy.example/p')).toBe(true);
		expect(re.test('https://example.com/vpn-guide')).toBe(true);
		expect(re.test('https://legit-torrent.example/movie')).toBe(false);
	});
});

describe('RankService', () => {
	let service: RankService;

	beforeEach(() => {
		service = new RankService(createMockEvent());
	});

	it('should check if a link is ignored', () => {
		expect(service.isIgnored('https://youtube.com/something')).toBe(true);
		expect(service.isIgnored('https://example.com/torrent')).toBe(false);
	});

	it('does not treat unescaped dots as wildcards against lookalike hosts', () => {
		// Regression: `youtube.com` as raw regex matched `youtubexcom`.
		expect(service.isIgnored('https://youtubexcom.evil/movie-torrent')).toBe(false);
		expect(service.isIgnored('https://not-youtube-com.example/torrent')).toBe(false);
		expect(service.isIgnored('https://youtube.com/watch?v=1')).toBe(true);
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
