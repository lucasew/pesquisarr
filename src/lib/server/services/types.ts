import type TorrentService from './torrent';
import type GoogleService from './search-google';
import type DuckDuckGoService from './search-duckduckgo';
import type YandexService from './search-yandex';
import type ImdbService from './imdb';

export interface Services {
	torrent: TorrentService;
	search_google: GoogleService;
	search_duckduckgo: DuckDuckGoService;
	search_yandex: YandexService;
	imdb: ImdbService;
}
