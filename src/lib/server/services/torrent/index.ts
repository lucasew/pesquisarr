import he from 'he';
import BaseService from '../base';
import decodeBencode from './bencode_decode';

export interface TorrentStream {
	infoHash: string;
	title: string;
}

/** RFC 4648 Base32 alphabet (BitTorrent btih 32-char form). */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** Decode a 32-char Base32 infohash to 40-char uppercase hex. */
export function base32InfoHashToHex(base32: string): string | null {
	const input = base32.toUpperCase().replace(/=+$/, '');
	if (input.length !== 32 || !/^[A-Z2-7]+$/.test(input)) {
		return null;
	}

	let bits = 0;
	let value = 0;
	const bytes: number[] = [];

	for (const ch of input) {
		const idx = BASE32_ALPHABET.indexOf(ch);
		if (idx < 0) return null;
		value = (value << 5) | idx;
		bits += 5;
		if (bits >= 8) {
			bits -= 8;
			bytes.push((value >>> bits) & 0xff);
		}
	}

	// SHA-1 is 20 bytes; reject if we did not get exactly that
	if (bytes.length !== 20) return null;

	return bytes
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
		.toUpperCase();
}

/** Normalize btih to 40-char uppercase hex (accepts hex or Base32). */
export function normalizeInfoHash(raw: string): string | null {
	const upper = raw.toUpperCase();
	if (upper.length === 40 && /^[0-9A-F]+$/.test(upper)) {
		return upper;
	}
	if (upper.length === 32) {
		return base32InfoHashToHex(upper);
	}
	return null;
}

/**
 * Magnets scraped from HTML often keep entity-encoded separators
 * (`&amp;` between query params). `URLSearchParams` then treats
 * `amp;dn` as a key name and drops `dn` / `tr`. Decode entities first
 * so param boundaries match a real magnet URI.
 */
export function normalizeMagnetLink(link: string): string {
	return he.decode(link.trim());
}

function extractXt(link: string): string | null {
	try {
		const parsedURL = new URL(link);
		const xt = parsedURL.searchParams.get('xt');
		if (!xt) return null;
		return xt.replace(/^urn:/i, '').replace(/^btih:/i, '');
	} catch {
		const xtMatch = link.match(/xt=urn:btih:([^&]*)/i);
		return xtMatch ? xtMatch[1] : null;
	}
}

function extractDn(link: string): string {
	try {
		const parsedURL = new URL(link);
		return parsedURL.searchParams.get('dn') || '(NO NAME)';
	} catch {
		const dnMatch = link.match(/[?&]dn=([^&]*)/i);
		if (dnMatch) {
			try {
				return decodeURIComponent(dnMatch[1]);
			} catch {
				return dnMatch[1];
			}
		}
		return '(NO NAME)';
	}
}

export default class TorrentService extends BaseService {
	async decodeTorrent(torrent: ArrayBuffer): Promise<TorrentStream | null> {
		try {
			const unbencode = decodeBencode(torrent, null, null, 'utf8');
			const { infohashFrom, infohashTo } = unbencode;
			const bufSlice = torrent.slice(infohashFrom, infohashTo);
			const digest = await crypto.subtle.digest({ name: 'SHA-1' }, bufSlice);
			const hexDigest = [...new Uint8Array(digest)]
				.map((b) => b.toString(16).padStart(2, '0'))
				.join('')
				.toUpperCase();

			const title = he.encode(unbencode.info?.name || 'Unknown Torrent');

			return {
				infoHash: hexDigest,
				title
			};
		} catch (e) {
			this.services.error.report(e, { message: 'Failed to decode torrent bencode' });
			return null;
		}
	}

	parseMagnet(link: string): TorrentStream | null {
		try {
			const magnet = normalizeMagnetLink(link);
			const rawHash = extractXt(magnet);
			if (!rawHash) return null;
			const infoHash = normalizeInfoHash(rawHash);
			if (!infoHash) return null;
			// Encode for HTML/JSON consumers; input entities were already normalized above.
			const title = he.encode(extractDn(magnet));
			return { infoHash, title };
		} catch (e) {
			this.services.error.report(e, { link, message: 'URL parsing failed in parseMagnet' });
			return null;
		}
	}
}
