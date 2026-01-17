import { error } from "@sveltejs/kit"

export async function load({ url, platform }) {
	const parsedURL = new URL(url);
	const params = parsedURL.searchParams;
	const use_google = params.get('use_google') !== '0' && params.get('use_google') !== 'false';
	const use_duckduckgo =
		params.get('use_duckduckgo') !== '0' && params.get('use_duckduckgo') !== 'false';
	const use_yandex = params.get('use_yandex') !== '0' && params.get('use_yandex') !== 'false';
	const query = params.get('query');
	if (!query) {
		error(400, 'no query');
	}
	const { services } = platform;
	const promises = [];
	if (use_google) {
		promises.push(services.google.search(query as string));
	}
	if (use_duckduckgo) {
		promises.push(services.duckduckgo.search(query as string));
	}
	if (use_yandex) {
		promises.push(services.yandex.search(query as string));
	}
	return {
		links: (await Promise.all(promises)).flat()
	};
}

