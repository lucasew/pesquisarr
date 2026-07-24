import { describe, it, expect, beforeEach } from 'vitest';
import TorrentService, {
	base32InfoHashToHex,
	buildMagnetLink,
	extractTrackers,
	normalizeInfoHash,
	normalizeMagnetLink,
	trackersFromTorrentMeta
} from './index';
import { createMockEvent } from '../test-utils';

const SAMPLE_HEX = '5D41402ABC4B2A76B9719D911017C5924068B73C';
const SAMPLE_TRACKER = 'http://tracker.example/announce';

/** Encode 20-byte hex to 32-char Base32 (fixture helper). */
function hexToBase32(hex: string): string {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
	const bytes = hex.match(/.{2}/g)!.map((h) => parseInt(h, 16));
	let bits = 0;
	let value = 0;
	let out = '';
	for (const b of bytes) {
		value = (value << 8) | b;
		bits += 8;
		while (bits >= 5) {
			bits -= 5;
			out += alphabet[(value >>> bits) & 31];
		}
	}
	if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
	return out;
}

describe('normalizeInfoHash', () => {
	it('accepts 40-char hex (case-insensitive)', () => {
		expect(normalizeInfoHash(SAMPLE_HEX.toLowerCase())).toBe(SAMPLE_HEX);
	});

	it('converts 32-char Base32 btih to hex', () => {
		const b32 = hexToBase32(SAMPLE_HEX);
		expect(b32).toHaveLength(32);
		expect(base32InfoHashToHex(b32)).toBe(SAMPLE_HEX);
		expect(normalizeInfoHash(b32)).toBe(SAMPLE_HEX);
	});

	it('rejects garbage', () => {
		expect(normalizeInfoHash('short')).toBeNull();
		expect(normalizeInfoHash('ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ')).toBeNull();
		expect(normalizeInfoHash('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')).toBeNull();
	});
});

describe('TorrentService', () => {
	let service: TorrentService;

	beforeEach(() => {
		service = new TorrentService(createMockEvent());
	});

	describe('parseMagnet', () => {
		it('should parse a valid magnet link', () => {
			const magnet = `magnet:?xt=urn:btih:${SAMPLE_HEX}&dn=test-torrent`;
			const result = service.parseMagnet(magnet);
			expect(result).not.toBeNull();
			expect(result?.infoHash).toBe(SAMPLE_HEX);
			expect(result?.title).toBe('test-torrent');
		});

		it('should return null for invalid magnet links', () => {
			expect(service.parseMagnet('not-a-magnet')).toBeNull();
			expect(service.parseMagnet('magnet:?xt=urn:btih:short')).toBeNull();
		});

		it('should handle magnets without dn parameter', () => {
			const magnet = `magnet:?xt=urn:btih:${SAMPLE_HEX}`;
			const result = service.parseMagnet(magnet);
			expect(result?.infoHash).toBe(SAMPLE_HEX);
			expect(result?.title).toBe('(NO NAME)');
		});

		it('should convert Base32 btih magnets to hex', () => {
			const b32 = hexToBase32(SAMPLE_HEX);
			const magnet = `magnet:?xt=urn:btih:${b32}&dn=base32-torrent`;
			const result = service.parseMagnet(magnet);
			expect(result?.infoHash).toBe(SAMPLE_HEX);
			expect(result?.title).toBe('base32-torrent');
		});

		it('recovers dn when HTML entity separators were scraped', () => {
			// href="magnet:?xt=…&amp;dn=…" in raw HTML keeps &amp; as text.
			const magnet = `magnet:?xt=urn:btih:${SAMPLE_HEX}&amp;dn=Test%20Movie&amp;tr=http%3A%2F%2Ftracker.example%2Fannounce`;
			const result = service.parseMagnet(magnet);
			expect(result).not.toBeNull();
			expect(result?.infoHash).toBe(SAMPLE_HEX);
			expect(result?.title).toBe('Test Movie');
			expect(result?.trackers).toEqual([SAMPLE_TRACKER]);
		});

		it('still parses plain magnets after entity normalization', () => {
			const magnet = `magnet:?xt=urn:btih:${SAMPLE_HEX}&dn=plain`;
			expect(normalizeMagnetLink(magnet)).toBe(magnet);
			expect(service.parseMagnet(magnet)?.title).toBe('plain');
		});

		it('preserves unique tr= trackers from the magnet', () => {
			const magnet = `magnet:?xt=urn:btih:${SAMPLE_HEX}&dn=t&tr=${encodeURIComponent(SAMPLE_TRACKER)}&tr=${encodeURIComponent(SAMPLE_TRACKER)}&tr=${encodeURIComponent('udp://other.example:80')}`;
			const result = service.parseMagnet(magnet);
			expect(result?.trackers).toEqual([SAMPLE_TRACKER, 'udp://other.example:80']);
		});

		it('returns empty trackers when tr= is absent', () => {
			const magnet = `magnet:?xt=urn:btih:${SAMPLE_HEX}&dn=no-trackers`;
			expect(service.parseMagnet(magnet)?.trackers).toEqual([]);
		});
	});
});

describe('extractTrackers / buildMagnetLink / trackersFromTorrentMeta', () => {
	it('round-trips trackers through buildMagnetLink', () => {
		const magnet = buildMagnetLink({
			infoHash: SAMPLE_HEX,
			title: 'Name',
			trackers: [SAMPLE_TRACKER, 'udp://b.example']
		});
		expect(extractTrackers(magnet)).toEqual([SAMPLE_TRACKER, 'udp://b.example']);
		expect(magnet).toContain(`xt=urn:btih:${SAMPLE_HEX}`);
		expect(magnet).toContain(`dn=${encodeURIComponent('Name')}`);
	});

	it('flattens announce and announce-list from torrent meta', () => {
		expect(
			trackersFromTorrentMeta({
				announce: SAMPLE_TRACKER,
				'announce-list': [[SAMPLE_TRACKER, 'udp://tier1'], ['http://tier2']]
			})
		).toEqual([SAMPLE_TRACKER, 'udp://tier1', 'http://tier2']);
	});
});
