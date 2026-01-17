import type { RequestEvent } from '@sveltejs/kit';
import TorrentService from './torrent';
import GoogleService from './search-google';
import DuckDuckGoService from './search-duckduckgo';
import YandexService from './search-yandex';
import ImdbService from './imdb';
import type { Services } from './types';

export type { Services };

export function initializeServices(event: RequestEvent): Services {
	event.services = {
		torrent: new TorrentService(event),
		search_google: new GoogleService(event),
		search_duckduckgo: new DuckDuckGoService(event),
		search_yandex: new YandexService(event),
		imdb: new ImdbService(event)
	};
	return event.services;
}
