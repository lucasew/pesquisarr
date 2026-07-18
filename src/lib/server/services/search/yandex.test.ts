import { describe, it, expect } from 'vitest';
import { matchFirstGroup } from '$lib/utils';
import YandexService from './yandex';
import { createMockEvent } from '../test-utils';

describe('YandexService SERP regex', () => {
	const service = new YandexService(createMockEvent());

	it('extracts absolute external destinations and skips Yandex chrome', () => {
		const html = `
			<a href="https://tracker.example/a.torrent">organic</a>
			<a href="https://www.yandex.com/search/?text=noise">chrome</a>
			<a href="https://yandex.ru/clck/jsredir?from=serp">clck</a>
			<a href="https://yastatic.net/s3/web4static/foo.js">asset</a>
			<a href="https://ya.ru/">short</a>
			<a href="/relative/path">relative</a>
			<a href="https%3A%2F%2Fencoded.example%2Fb">percent-not-in-href</a>
			<a href="http://mirror.example/c">http</a>
		`;
		const urls = matchFirstGroup(html, service.regex);
		expect(urls).toEqual(['https://tracker.example/a.torrent', 'http://mirror.example/c']);
	});

	it('does not match the previous catch-all href pattern behavior', () => {
		const old = /href="(.*?)"/g;
		const sample = '<a href="/only-relative">x</a><a href="https://ok.example/t">y</a>';
		expect(matchFirstGroup(sample, old)).toEqual(['/only-relative', 'https://ok.example/t']);
		service.regex.lastIndex = 0;
		expect(matchFirstGroup(sample, service.regex)).toEqual(['https://ok.example/t']);
	});

	it('keeps third-party hosts that merely contain the word yandex', () => {
		const html = '<a href="https://notyandex.example/page">x</a>';
		expect(matchFirstGroup(html, service.regex)).toEqual(['https://notyandex.example/page']);
	});
});
