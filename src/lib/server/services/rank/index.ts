import BaseService from '../base';
import data from './data.json';

export default class RankService extends BaseService {
	private regexIgnored = new RegExp(data.ignoredDomains.join('|'), 'i');

	isIgnored(link: string): boolean {
		return this.regexIgnored.test(link);
	}

	rank(links: string[]): string[] {
		return links
			.filter((link) => !this.isIgnored(link))
			.sort((a, b) => b.length - a.length)
			.sort((a, b) => {
				const aFree = a.includes('free') ? 1 : 0;
				const bFree = b.includes('free') ? 1 : 0;
				return aFree - bFree;
			})
			.sort((a, b) => {
				const aTorrent = a.includes('torrent') ? -1 : 0;
				const bTorrent = b.includes('torrent') ? -1 : 0;
				return aTorrent - bTorrent;
			});
	}
}
