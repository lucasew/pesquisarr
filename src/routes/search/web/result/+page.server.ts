import { error } from "@sveltejs/kit"
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const parsedURL = new URL(url);
	const params = parsedURL.searchParams;
	const use_google = params.get('use_google') !== '0' && params.get('use_google') !== 'false';
	const use_duckduckgo =
		params.get('use_duckduckgo') !== '0' && params.get('use_duckduckgo') !== 'false';
	const use_yandex = params.get('use_yandex') !== '0' && params.get('use_yandex') !== 'false';
	const query = params.get('query') ?? "";
	if (!query) {
		error(400, 'no query');
	}

    const selectedEngines: string[] = [];
    if (use_google) selectedEngines.push('google');
    if (use_duckduckgo) selectedEngines.push('duckduckgo');
    if (use_yandex) selectedEngines.push('yandex');

	const { services } = locals;
	const links = await services.search.search(query, selectedEngines);

	const rankedLinks = services.rank
		.rank(links.map((l) => l.link))
		.map((link) => links.find((l) => l.link === link))
		.filter((l): l is (typeof links)[0] => !!l);

	return {
		links,
		rankedLinks
	};
};
