import SearchBaseService from '../search/base';

export default class YandexService extends SearchBaseService {
	urlTemplate = 'https://yandex.com/search/?text=';
	regex = /href="(.*?)"/g;
	sourceName = 'Yandex';
}
