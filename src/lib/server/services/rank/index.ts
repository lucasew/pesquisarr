import BaseService from '../base';
import data from './data.json';

/**
 * Service responsible for filtering and prioritizing discovered torrent links.
 * It applies basic heuristics to improve the quality of search results presented to the user.
 */
export default class RankService extends BaseService {
	// Pre-compiled regex from data.json to quickly match unwanted domains
	private regexIgnored = new RegExp(data.ignoredDomains.join('|'), 'i');

	/**
	 * Checks if a link belongs to a domain known to be useless or malicious.
	 * The list of ignored domains is loaded from `data.json`.
	 *
	 * @param link The URL to evaluate
	 * @returns true if the link matches any ignored domain
	 */
	isIgnored(link: string): boolean {
		return this.regexIgnored.test(link);
	}

	/**
	 * Filters and sorts an array of raw links to bubble up the best candidates.
	 *
	 * - Discards any link matching `isIgnored()`.
	 * - Prefers shorter URLs over longer ones (often less spammy/tracking-heavy).
	 * - Gives a slight boost to links containing "free" (often legit public trackers).
	 * - Strongly boosts links containing "torrent" to ensure relevance.
	 *
	 * @param links Array of extracted URLs to rank
	 * @returns A filtered, sorted array of the best links
	 */
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
