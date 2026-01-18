import type { RequestEvent } from '@sveltejs/kit';
import TorrentService from './torrent';
import DuckDuckGoService from './search-duckduckgo';
import GoogleService from './search-google';
import YandexService from './search-yandex';
import ImdbService from './imdb';
import SearchService from './search';
import ScraperService from './scraper';
import RankService from './rank';
import HttpService from './http';

export function getServices(event: RequestEvent) {
	return {
		http: new HttpService(event),
		torrent: new TorrentService(event),
		search_duckduckgo: new DuckDuckGoService(event),
		search_google: new GoogleService(event),
		search_yandex: new YandexService(event),
		search: new SearchService(event),
		imdb: new ImdbService(event),
		scraper: new ScraperService(event),
		rank: new RankService(event)
	};
}

export function initializeServices(event: RequestEvent) {
	if (!event.locals.services) {
		event.locals.services = getServices(event);
	}
	return event.locals.services;
}
