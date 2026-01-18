import { error } from "@sveltejs/kit"
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const parsedURL = new URL(url);
	const params = parsedURL.searchParams;
	const use_google = params.get('use_google') !== '0' && params.get('use_google') !== 'false';
	const use_duckduckgo =
		params.get('use_duckduckgo') !== '0' && params.get('use_duckduckgo') !== 'false';
	const use_yandex = params.get('use_yandex') !== '0' && params.get('use_yandex') !== 'false';
	const query = params.get('query');
	if (!query) {
		throw error(400, 'no query');
	}

	const selectedEngines: string[] = [];
	if (use_google) selectedEngines.push('google');
	if (use_duckduckgo) selectedEngines.push('duckduckgo');
	if (use_yandex) selectedEngines.push('yandex');

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
	return { links };
};
