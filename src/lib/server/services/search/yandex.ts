import SearchBaseService from './base';

export default class YandexService extends SearchBaseService {
	urlTemplate = 'https://yandex.com/search/?text=';
	// Absolute external destinations only. The previous /href="(.*?)"/g matched every
	// href on the SERP (relative chrome, Yandex assets, clck wrappers), flooding
	// rank/scrape with junk that only later failed isValidHttpUrl or pointed at
	// Yandex itself — parallel to the Google /url?q= tightening in #722.
	regex =
		/href="(https?:\/\/(?!(?:[\w-]+\.)*(?:yandex\.[a-z.]+|ya\.ru|yastatic\.net)(?:\/|"|\?))[^"]+)"/gi;
	sourceName = 'Yandex';
}
