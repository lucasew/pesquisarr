import he from 'he';
import BaseService from '../base';
import decodeBencode from './bencode_decode';

export interface TorrentStream {
	infoHash: string;
	title: string;
}

export default class TorrentService extends BaseService {
	/**
	 * Extracts the torrent streams (infoHash and title) directly from a raw `.torrent` file buffer.
	 *
	 * To accurately verify the file integrity against metadata sources or trackers, this calculates
	 * the SHA-1 digest strictly from the exact byte-slice containing the bencoded `info` dictionary.
	 * It also applies strict HTML-entity escaping (using `he`) to the torrent name to prevent XSS.
	 *
	 * @param torrent Raw ArrayBuffer representing the downloaded `.torrent` file.
	 * @returns The parsed and sanitized torrent stream, or null if bencode decoding fails.
	 */
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

	/**
	 * Parses a `magnet:` string into a standardized torrent stream.
	 *
	 * It enforces 32 or 40 character infoHashes (Base32/Hex), always upper-casing them.
	 * The extracted display name (`dn`) parameter is defensively sanitized with `he` to thwart XSS,
	 * with a safe '(NO NAME)' fallback if omitted. Also includes fallback logic for raw string parsing
	 * when strict URL construction fails (due to malformed magnet links).
	 *
	 * @param link A string representing a raw `magnet:` URI.
	 * @returns The normalized and sanitized torrent stream, or null if the infoHash is invalid or absent.
	 */
	parseMagnet(link: string): TorrentStream | null {
		try {
			const parsedURL = new URL(link);
			let infoHash = parsedURL.searchParams.get('xt');
			if (infoHash) {
				infoHash = infoHash.replace('urn:', '').replace('btih:', '');
			}
			if (!infoHash || (infoHash.length !== 40 && infoHash.length !== 32)) {
				return null;
			}
			// If it's Base32 (32 chars), it should ideally be converted to Hex (40 chars)
			// For now, let's keep it simple and ensure it's uppercase
			infoHash = infoHash.toUpperCase();

			const title = he.encode(parsedURL.searchParams.get('dn') || '(NO NAME)');
			return { infoHash, title };
		} catch {
			// Handle cases where magnet link is not a valid URL (some might be just magnet:?...)
			if (link.startsWith('magnet:?')) {
				const xtMatch = link.match(/xt=urn:btih:([^&]*)/i);
				const dnMatch = link.match(/dn=([^&]*)/i);
				if (xtMatch) {
					const infoHash = xtMatch[1].toUpperCase();
					const title = dnMatch ? he.encode(decodeURIComponent(dnMatch[1])) : '(NO NAME)';
					if (infoHash.length === 40 || infoHash.length === 32) {
						return { infoHash, title };
					}
				}
			}
			return null;
		}
	}
}
