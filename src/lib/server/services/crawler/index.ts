import { matchFirstGroup } from "$lib/utils";
import { getTextOfJSDocComment } from "typescript";
import BaseService from "../base";

import data from './data.json'
export const REGEX_IGNORED_DOMAINS = new RegExp(data.ignoredDomains.join('|'), 'i');

export const REGEX_MATCH_MAGNET = /(magnet:[^"' ]*)/g;
export const REGEX_MATCH_INFOHASH = /[0-9A-F]{40}/;


interface TorrentStream {
	infoHash: string;
	title: string;
}


export default class CrawlerService extends BaseService {
    

    async fetchTorrentsInSite(url: string) {
        if (!this.isValidHttpUrl(url)) {
            return [];
        }
        try {
            const response = await fetch(url, {
                cf: {
                    cacheTtl: 2 * 3600,
                    cacheEverything: true
                }
            });
            const contentType = response.headers.get('Content-Type');
            if (
                contentType === 'application/x-bittorrent' ||
                url.search(REGEX_MATCH_INFOHASH) !== -1 ||
                url.endsWith('.torrent')
            ) {
                const arrayBuffer = await response.arrayBuffer();
                const bencoded = await this.services.torrent.decodeTorrent(arrayBuffer);
                let magnetLink = 'magnet:?xt=urn:btih:';
                magnetLink += bencoded.infohash;
                if (bencoded.info?.name) {
                    magnetLink += `&dn=${encodeURIComponent(bencoded.info.name)}`;
                }
                const trackers = [bencoded.announce, bencoded['announce-list']].flat();
                trackers.forEach((tracker) => {
                    if (tracker) {
                        magnetLink += `&tr=${encodeURIComponent(tracker)}`;
                    }
                });
                return [magnetLink];
            } else if (contentType === 'application/octet-stream') {
                return [];
            } else {
                const text = await response.text();
                return matchFirstGroup(text, REGEX_MATCH_MAGNET);
            }
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    /**
     * Checks if a given string is a valid and safe HTTP/HTTPS URL.
     * @param url The URL string to validate.
     * @returns `true` if the URL is valid and safe, `false` otherwise.
     */
    isValidHttpUrl(url: string): boolean {
        try {
            const parsedUrl = new URL(url);

            // 1. Check for valid protocols
            if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
                return false;
            }

            // 2. Prevent requests to internal or reserved IP addresses
            // For IPv6, hostname is bracketed (e.g., [::1]), so we strip them for regex matching.
            const hostname = parsedUrl.hostname.replace(/[[\]]/g, '');

            if (hostname.toLowerCase() === 'localhost' || hostname === '0' || hostname === '0.0.0.0') {
                return false;
            }

            // List of regexes for private and reserved IP ranges.
            const privateIpRegexes = [
                /^127\./, // IPv4 loopback: 127.0.0.0/8
                /^10\./, // IPv4 private Class A: 10.0.0.0/8
                /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // IPv4 private Class B: 172.16.0.0/12
                /^192\.168\./, // IPv4 private Class C: 192.168.0.0/16
                /^::1$/, // IPv6 loopback: ::1
                /^fd[0-9a-f]{2}:/i // IPv6 unique local addresses: fc00::/7
            ];

            if (privateIpRegexes.some((regex) => regex.test(hostname))) {
                return false;
            }

            return true;
        } catch {
            // URL parsing failed, so it's not a valid URL
            return false;
        }
    }

    rankLinks(links: string[]): string[] {
        return links
            .filter((link) => !REGEX_IGNORED_DOMAINS.test(link)) // ignore unwanted words/domains
            .sort((x) => x.length) // priorize longer links, those are more likely to be posts instead of homepages
            .sort((v) => (v.match('free') ? 1 : -1)) // depriorize links with free in their name
            .sort((v) => (v.match('torrent') ? -1 : 1)); // priorize links with torrent in their name
    }


  async getTorrentStreams(imdbId: string): Promise<TorrentStream[]> {
	const title = await this.services.imdb.getTitleById(imdbId);
	const siteLinks = await this.services.search.search(`${encodeURIComponent(title)} torrent`);

    const rankedLinks = this.rankLinks(siteLinks.map(l => l.link))
    const fetchedTorrentsByLink = await Promise.all(rankedLinks.map(this.fetchTorrentsInSite))
    const fetchedTorrents = fetchedTorrentsByLink.flat()
    


	const links =  await this.fetchTorrentsInSite fetchTorrentsInLinks(siteLinks.map(l => l.link));
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





}