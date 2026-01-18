import type { RequestEvent } from '@sveltejs/kit';
import TorrentService from './torrent';
import DuckDuckGoService from './search-duckduckgo';
import GoogleService from './search-google';
import YandexService from './search-yandex';
import ImdbService from './imdb';

export async function initializeServices(event: RequestEvent) {
	if (!event.locals.services) {
		event.locals.services = {
			torrent: new TorrentService(event),
			search_duckduckgo: new DuckDuckGoService(event),
			search_google: new GoogleService(event),
			search_yandex: new YandexService(event),
			imdb: new ImdbService(event),
		}
	}
	return event.locals.services
}

