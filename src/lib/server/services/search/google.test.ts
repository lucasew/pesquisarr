import { describe, it, expect } from 'vitest';
import { matchFirstGroup } from '$lib/utils';
import GoogleService from './google';
import { createMockEvent } from '../test-utils';

describe('GoogleService SERP regex', () => {
	const service = new GoogleService(createMockEvent());

	it('extracts destinations from /url?q= wrappers', () => {
		const html = `
			<a href="/url?q=https://example.com/a.torrent&amp;sa=U">a</a>
			<a href="/url?q=https%3A%2F%2Ftracker.example%2Fb&sa=U">b</a>
			<a href="https://google.com/path">noise</a>
		`;
		const urls = matchFirstGroup(html, service.regex);
		expect(urls).toEqual([
			'https://example.com/a.torrent',
			'https%3A%2F%2Ftracker.example%2Fb'
		]);
	});

	it('does not treat optional-backslash form as the intended pattern', () => {
		// Old buggy pattern /\/url\\?q=/ matched "/urlq=" not "/url?q="
		const buggy = /\/url\\?q=([^"&]*)/g;
		const sample = '/url?q=https://example.com/x';
		expect(buggy.test(sample)).toBe(false);
		buggy.lastIndex = 0;
		service.regex.lastIndex = 0;
		expect(service.regex.test(sample)).toBe(true);
	});
});
