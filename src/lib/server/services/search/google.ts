import SearchBaseService from './base';

export default class GoogleService extends SearchBaseService {
	urlTemplate = 'https://www.google.com/search?q=';
	// Match Google result wrappers: /url?q=<dest> (literal "?", not optional backslash)
	regex = /\/url\?q=([^"&]*)/g;
	sourceName = 'Google';
}
