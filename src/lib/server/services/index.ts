import type { RequestEvent } from '@sveltejs/kit';
import TorrentService from './torrent';
import GoogleService from './search-google';
import DuckDuckGoService from './search-duckduckgo';
import YandexService from './search-yandex';
import ImdbService from './imdb';

export type Services = {
	torrent: TorrentService;
	google: GoogleService;
	duckduckgo: DuckDuckGoService;
	yandex: YandexService;
	imdb: ImdbService;
};

export async function initializeServices(event: RequestEvent): Promise<Services> {
	const services = {} as Services;

	// Initialize in dependency order if needed, but parallel is fine
	const servicePromises = [
		{ key: 'torrent', service: new TorrentService(event.platform!, event) },
		{ key: 'google', service: new GoogleService(event.platform!, event) },
		{ key: 'duckduckgo', service: new DuckDuckGoService(event.platform!, event) },
		{ key: 'yandex', service: new YandexService(event.platform!, event) },
		{ key: 'imdb', service: new ImdbService(event.platform!, event) }
	];

	await Promise.all(
		servicePromises.map(async ({ key, service }) => {
			(services as any)[key] = service;
		})
	);

	return services;
}
