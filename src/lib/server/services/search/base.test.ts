import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import SearchBaseService, { safeDecodeURIComponent } from './base';
import { createMockEvent } from '../test-utils';
import type { AppEvent } from '../../app-event';

class TestSearchService extends SearchBaseService {
	urlTemplate = 'https://example-search.test/?q=';
	regex = /href="([^"]+)"/g;
	sourceName = 'TestEngine';
}

describe('safeDecodeURIComponent', () => {
	it('decodes percent-encoded absolute URLs', () => {
		expect(safeDecodeURIComponent('https%3A%2F%2Ftracker.example%2Fb')).toBe(
			'https://tracker.example/b'
		);
	});

	it('leaves already-decoded URLs unchanged', () => {
		expect(safeDecodeURIComponent('https://example.com/a.torrent')).toBe(
			'https://example.com/a.torrent'
		);
	});

	it('does not throw on malformed percent sequences', () => {
		expect(() => safeDecodeURIComponent('https://example.com/%ZZ')).not.toThrow();
		// Raw string remains a valid http URL → keep it
		expect(safeDecodeURIComponent('https://example.com/%ZZ')).toBe('https://example.com/%ZZ');
	});

	it('drops non-URL garbage with bad percent encoding', () => {
		expect(safeDecodeURIComponent('%E0%A4%A')).toBeNull();
	});
});

describe('SearchBaseService.search', () => {
	let service: TestSearchService;
	let mockEvent: AppEvent;
	let getHtml: Mock;
	let report: Mock;

	beforeEach(() => {
		mockEvent = createMockEvent();
		getHtml = vi.fn();
		report = mockEvent.locals.services.error.report as Mock;
		mockEvent.locals.services = {
			...mockEvent.locals.services,
			http: { getHtml, fetch: vi.fn(), getBuffer: vi.fn() }
		} as unknown as typeof mockEvent.locals.services;
		service = new TestSearchService(mockEvent);
	});

	it('keeps good links when one capture has a malformed percent sequence', async () => {
		getHtml.mockResolvedValue(`
			<a href="https://good.example/a.torrent">a</a>
			<a href="%c0">not-a-url</a>
			<a href="https%3A%2F%2Fencoded.example%2Fb">b</a>
		`);

		const results = await service.search('movie');
		expect(report).not.toHaveBeenCalled();
		expect(results.map((r) => r.link)).toEqual([
			'https://good.example/a.torrent',
			'https://encoded.example/b'
		]);
		expect(results.every((r) => r.source === 'TestEngine')).toBe(true);
	});

	it('does not empty the engine when decode would have thrown on the set', async () => {
		// Regression: previous code used .map(decodeURIComponent) so one bad URL
		// threw URIError and the outer catch returned [].
		getHtml.mockResolvedValue(`
			<a href="https://only-good.example/x">x</a>
			<a href="%c0">junk</a>
		`);

		const results = await service.search('q');
		expect(results).toHaveLength(1);
		expect(results[0].link).toBe('https://only-good.example/x');
	});

	it('keeps an already-absolute URL when only a path segment is malformed', async () => {
		getHtml.mockResolvedValue(`
			<a href="https://site.example/path/%ZZ">raw</a>
			<a href="https://other.example/ok">ok</a>
		`);

		const results = await service.search('q');
		expect(results.map((r) => r.link).sort()).toEqual([
			'https://other.example/ok',
			'https://site.example/path/%ZZ'
		]);
	});
});
