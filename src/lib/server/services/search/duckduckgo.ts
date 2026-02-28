import SearchBaseService from './base';

export default class DuckDuckGoService extends SearchBaseService {
	urlTemplate = 'https://duckduckgo.com/html?q=';
	regex = /uddg=([^&"]*)/g;
	sourceName = 'DuckDuckGo';
}
