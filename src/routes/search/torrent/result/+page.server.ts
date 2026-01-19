import { error } from "@sveltejs/kit"
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const parsedURL = new URL(url);
	const params = parsedURL.searchParams;
	const query = params.get('query');
	if (!query) {
		throw error(400, 'no query');
	}

	const selectedEngines = ['google', 'duckduckgo', 'yandex'].filter((engine) => {
		const param = params.get(`use_${engine}`);
		return param !== '0' && param !== 'false';
	});

	const { services } = locals;
	// Gather search results with source tags
	const searchResults = await services.search.search(query, selectedEngines);

	// For each search result, fetch torrents and tag with source
	const fetched = await Promise.all(
		searchResults.map(async (r) => {
			const streams = await services.scraper.fetchTorrentsInSite(r.link).catch(() => []);
			return streams.map((s) => {
				const magnet = services.torrent.createMagnet(s);
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
