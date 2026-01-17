import BaseService from '../base';
import he from 'he';

interface TorrentStream {
	infoHash: string;
	title: string;
}

export default class TorrentService extends BaseService {
	async getStreams(imdbId: string): Promise<TorrentStream[]> {
		if (!this.services) throw new Error('Services not initialized');
		const title = await this.services.imdb.getTitleById(imdbId);
		const searchResults = await Promise.all([
			this.services.search_google.search(`${encodeURIComponent(title)} torrent`),
			this.services.search_duckduckgo.search(`${encodeURIComponent(title)} torrent`),
			this.services.search_yandex.search(`${encodeURIComponent(title)} torrent`)
		]);
		const links = searchResults.flat().map((s) => s.link);
		return links
			.map((link): TorrentStream | null => {
				let parsedURL;
				try {
					parsedURL = new URL(link);
				} catch {
					return null;
				}
				let infoHash = parsedURL.searchParams.get('xt');
				if (infoHash) {
					infoHash = infoHash.replace('urn:', '').replace('btih:', '');
				}
				if (!infoHash || infoHash.length != 40) {
					return null;
				}
				const title = parsedURL.searchParams.get('dn') || '(NO NAME)';
				return { infoHash, title };
			})
			.filter((stream): stream is TorrentStream => stream !== null);
	}

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

	private rankLinks(links: string[]): string[] {
		return links.sort((a, b) => {
			const aScore = (a.includes('magnet') ? 10 : 0) + (a.includes('torrent') ? 5 : 0);
			const bScore = (b.includes('magnet') ? 10 : 0) + (b.includes('torrent') ? 5 : 0);
			return bScore - aScore;
		});
	}

	private async fetchTorrentsInSite(link: string): Promise<string[]> {
		const response = await fetch(link, {
			cf: {
				cacheTtl: 7200,
				cacheEverything: true
			} as any
		});
		const responseText = await response.text();
		const magnetLinks = responseText.match(/magnet:\?[^"']*/g) || [];
		return magnetLinks;
	}

	async healthCheck() {
		try {
			if (!this.services) throw new Error('Services not initialized');
			await this.services.search_google.search('test');
			return { ok: true };
		} catch {
			return { ok: false, error: 'Search services unavailable' };
		}
	}
}
