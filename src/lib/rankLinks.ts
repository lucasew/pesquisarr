export const IGNORED_DOMAINS = [
	'archive.org',
	'drive.google.com',
	'facebook.com',
	'imdb.com',
	'proxy',
	'reddit.com',
	'sites.google.com',
	'torrentfreak',
	'vpn',
	'wixsite.com',
	'youtube.com',
	'linkedin.com',
	'wikipedia.org'
];

export const REGEX_IGNORED_DOMAINS = new RegExp(IGNORED_DOMAINS.join('|'), 'i');

export function rankLinks(links: string[]): string[] {
	return links
		.filter((link) => !REGEX_IGNORED_DOMAINS.test(link)) // ignore unwanted words/domains
		.sort((a, b) => b.length - a.length) // priorize longer links, those are more likely to be posts instead of homepages
		.sort((a, b) => {
			const aFree = a.includes('free') ? 1 : 0;
			const bFree = b.includes('free') ? 1 : 0;
			return aFree - bFree; // depriorize links with free in their name
		})
		.sort((a, b) => {
			const aTorrent = a.includes('torrent') ? -1 : 0;
			const bTorrent = b.includes('torrent') ? -1 : 0;
			return aTorrent - bTorrent; // priorize links with torrent in their name
		});
}
