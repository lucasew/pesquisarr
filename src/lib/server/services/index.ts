import type { RequestEvent } from '@sveltejs/kit';
import TorrentService from './torrent';
import DuckDuckGoService from './search-duckduckgo';
import GoogleService from './search-google';
import YandexService from './search-yandex';
import ImdbService from './imdb';

export function getServices(event: RequestEvent) {
	return {
		torrent: new TorrentService(event),
		search_duckduckgo: new DuckDuckGoService(event),
		search_google: new GoogleService(event),
		search_yandex: new YandexService(event),
		imdb: new ImdbService(event),
	}
}

export function initializeServices(event: RequestEvent) {
	if (!event.locals.services) {
		event.locals.services = getServices(event)
	}
	return event.locals.services
}

