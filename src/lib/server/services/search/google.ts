import SearchBaseService from './base';

export default class GoogleService extends SearchBaseService {
	urlTemplate = 'https://www.google.com/search?q=';
	regex = /\/url\\?q=([^"&]*)/g;
	sourceName = 'Google';
}
