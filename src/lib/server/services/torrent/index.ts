import BaseService from '../base';
import he from 'he';
import decodeBencode from './bencode_decode'

interface TorrentStream {
	infoHash: string;
	title: string;
}

export default class TorrentService extends BaseService {
	async fetchTorrentsInLinks(links: string[]): Promise<string[]> {
		const sortedLinks = this.rankLinks(links);
		const fetched = await Promise.all(
			sortedLinks.map((t) => this.fetchTorrentsInSite(t).catch(() => []))
		);
		const fetchedProcessed = fetched
			.flat()
			.map((x) => he.decode(x))
			.sort((t) => -t.indexOf('dn='));
		return [...new Set(fetchedProcessed)];
	}

	rankLinks(links: string[]): string[] {
		return links.sort((a, b) => {
			const aScore = (a.includes('magnet') ? 10 : 0) + (a.includes('torrent') ? 5 : 0);
			const bScore = (b.includes('magnet') ? 10 : 0) + (b.includes('torrent') ? 5 : 0);
			return bScore - aScore;
		});
	}

	private async fetchTorrentsInSite(link: string): Promise<string[]> {
		const response = await fetch(link, {
			// @ts-ignore
			cf: {
				cacheTtl: 7200,
				cacheEverything: true
			}
		});
		const responseText = await response.text();
		const magnetLinks = responseText.match(/magnet:\?[^"']*/g) || [];
		return magnetLinks;
	}

	async decodeTorrent(torrent: ArrayBuffer) {
		const unbencode = decodeBencode(torrent, null, null, 'utf8');
		const { infohashFrom, infohashTo } = unbencode;
		const bufSlice = torrent.slice(infohashFrom, infohashTo);
		const digest = await crypto.subtle.digest({ name: 'SHA-1' }, bufSlice);
		const hexDigest = [...new Uint8Array(digest)]
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('')
			.toUpperCase();
		delete unbencode.infohashFrom;
		delete unbencode.infohashTo;
		unbencode['infohash'] = hexDigest;
		return unbencode;
	}
}
