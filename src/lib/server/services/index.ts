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

export async function initializeServices(platform: App.Platform): Promise<Services> {
	const services = {} as Services;

	// Initialize in dependency order if needed, but parallel is fine
	const servicePromises = [
		{ key: 'torrent', service: new TorrentService(platform) },
		{ key: 'google', service: new GoogleService(platform) },
		{ key: 'duckduckgo', service: new DuckDuckGoService(platform) },
		{ key: 'yandex', service: new YandexService(platform) },
		{ key: 'imdb', service: new ImdbService(platform) }
	];

	await Promise.all(
		servicePromises.map(async ({ key, service }) => {
			(services as any)[key] = service;
		})
	);

	platform.services = services;

	return services;
}
