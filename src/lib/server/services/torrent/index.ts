import he from 'he';
import BaseService from '../base';
import decodeBencode from './bencode_decode';

export interface TorrentStream {
	infoHash: string;
	title: string;
}

/**
 * Service for parsing and decoding torrent data formats.
 * Normalizes both raw `.torrent` files and magnet URIs into a standard `TorrentStream` object
 * containing an uppercase `infoHash` and a sanitized `title`.
 */
export default class TorrentService extends BaseService {
	/**
	 * Extracts the infohash and display name from a raw bencoded `.torrent` file buffer.
	 * Computes the SHA-1 digest from the exact byte range of the `info` dictionary,
	 * ensuring the hash matches what torrent clients expect. Titles are HTML-entity encoded via `he` to prevent XSS.
	 *
	 * @param torrent - The raw array buffer of a `.torrent` file
	 * @returns The parsed stream containing `infoHash` and `title`, or null if decoding fails
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
	 * Parses a magnet URI string to extract the `infoHash` (`xt` parameter) and title (`dn` parameter).
	 * Handles standard URI parsing via `new URL()` as well as a regex fallback for malformed or non-standard `magnet:?` strings.
	 * Currently accepts both 40-character Hex and 32-character Base32 infohashes, normalizing them to uppercase.
	 *
	 * @param link - The raw magnet link string
	 * @returns The parsed stream or null if the infohash is missing/invalid length
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
