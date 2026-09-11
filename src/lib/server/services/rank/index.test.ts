import { describe, it, expect, beforeEach } from 'vitest';
import RankService, {
	buildIgnoredDomainRegex,
	escapeRegExp,
	hasFreeKeyword
} from './index';
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

describe('hasFreeKeyword', () => {
	it('matches free as a path/token, not as a substring of other words', () => {
		expect(hasFreeKeyword('https://example.com/Free-Download/x')).toBe(true);
		expect(hasFreeKeyword('https://example.com/free/movie')).toBe(true);
		expect(hasFreeKeyword('https://example.com/get_free_movies')).toBe(true);
		expect(hasFreeKeyword('https://example.com/freedom-movie')).toBe(false);
		expect(hasFreeKeyword('https://example.com/freebsd-iso')).toBe(false);
		expect(hasFreeKeyword('https://example.com/freefall')).toBe(false);
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

	it('ranks torrent/free keywords case-insensitively', () => {
		// Indexer paths often use Title Case; case-sensitive includes() would demote
		// real torrent URLs and miss Free-download spam.
		const links = [
			'https://example.com/Movie',
			'https://example.com/Movie/Torrent/File',
			'https://example.com/Free-Download/Movie'
		];
		const result = service.rank(links);
		expect(result[0]).toBe('https://example.com/Movie/Torrent/File');
		// "Free" is penalized vs plain movie (same torrent-score tier)
		const freeIdx = result.indexOf('https://example.com/Free-Download/Movie');
		const plainIdx = result.indexOf('https://example.com/Movie');
		expect(freeIdx).toBeGreaterThan(plainIdx);
	});

	it('does not penalize free as a substring of other words', () => {
		// Regression: includes('free') ranked freedom/freebsd below plain paths.
		const links = [
			'https://example.com/freedom-movie',
			'https://example.com/freebsd-iso',
			'https://example.com/Free-Download/spam'
		];
		const result = service.rank(links);
		const freeSpam = result.indexOf('https://example.com/Free-Download/spam');
		const freedom = result.indexOf('https://example.com/freedom-movie');
		const freebsd = result.indexOf('https://example.com/freebsd-iso');
		expect(freeSpam).toBeGreaterThan(freedom);
		expect(freeSpam).toBeGreaterThan(freebsd);
	});
});
