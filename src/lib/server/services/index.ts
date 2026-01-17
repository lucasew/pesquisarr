import type { RequestEvent } from '@sveltejs/kit';

export type Services = {
	torrent: import('./torrent').default;
	search_google: import('./search-google').default;
	search_duckduckgo: import('./search-duckduckgo').default;
	search_yandex: import('./search-yandex').default;
	imdb: import('./imdb').default;
};

export async function initializeServices(event: RequestEvent): Promise<void> {
	if (event.locals.services) return;

	const [TorrentService, GoogleService, DuckDuckGoService, YandexService, ImdbService] =
		await Promise.all([
			import('./torrent').then((m) => m.default),
			import('./search-google').then((m) => m.default),
			import('./search-duckduckgo').then((m) => m.default),
			import('./search-yandex').then((m) => m.default),
			import('./imdb').then((m) => m.default)
		]);

	const services = {} as Services;
	event.locals.services = services;

	services.torrent = new TorrentService(event);
	services.search_google = new GoogleService(event);
	services.search_duckduckgo = new DuckDuckGoService(event);
	services.search_yandex = new YandexService(event);
	services.imdb = new ImdbService(event);
}

export * from './base';
