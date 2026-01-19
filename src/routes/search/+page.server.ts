import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const query = url.searchParams.get('query');
	if (!query) {
		return { links: [] };
	}

	const selectedEngines = ['google', 'duckduckgo', 'yandex'];

	const { services } = locals;
	// Gather search results with source tags
	const searchResults = await services.search.search(query, selectedEngines);

	// For each search result, fetch torrents and tag with source
	const fetched = await Promise.all(
		searchResults.map(async (r) => {
			const streams = await services.scraper.fetchTorrentsInSite(r.link).catch(() => []);
			return streams.map((s) => {
				let magnet = `magnet:?xt=urn:btih:${s.infoHash}`;
				if (s.title) {
					magnet += `&dn=${encodeURIComponent(s.title)}`;
				}
				return { magnet, source: r.source };
			});
		})
	);
	// Flatten, dedupe by magnet URL, keep first source
	const entries = fetched.flat();
	const map = new Map<string, string>();
	for (const { magnet, source } of entries) {
		if (!map.has(magnet)) map.set(magnet, source);
	}
	const links = Array.from(map.entries()).map(([torrent, source]) => ({ torrent, source }));
	return { links, query };
};
