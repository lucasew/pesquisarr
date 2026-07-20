import BaseService from '../base';
import data from './data.json';

function rankScore(link: string): [number, number, number] {
	// Prefer torrent in URL, penalize "free", then longer URLs as tiebreaker
	const torrent = link.includes('torrent') ? 0 : 1;
	const free = link.includes('free') ? 1 : 0;
	const lengthPenalty = -link.length;
	return [torrent, free, lengthPenalty];
}

/** Escape a domain/keyword so dots and other metacharacters match literally. */
export function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build the ignore matcher from configured domains/keywords.
 * Patterns are joined with `|` after escaping so e.g. `youtube.com` does not
 * match `youtubexcom` (`.` as "any character").
 */
export function buildIgnoredDomainRegex(domains: string[]): RegExp {
	if (domains.length === 0) {
		// Match nothing; used only if config is emptied.
		return /(?!)/;
	}
	return new RegExp(domains.map(escapeRegExp).join('|'), 'i');
}

export default class RankService extends BaseService {
	private regexIgnored = buildIgnoredDomainRegex(data.ignoredDomains);

	isIgnored(link: string): boolean {
		return this.regexIgnored.test(link);
	}

	rank(links: string[]): string[] {
		return links
			.filter((link) => !this.isIgnored(link))
			.sort((a, b) => {
				const sa = rankScore(a);
				const sb = rankScore(b);
				for (let i = 0; i < sa.length; i++) {
					if (sa[i] !== sb[i]) return sa[i] - sb[i];
				}
				return 0;
			});
	}
}
