import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import ImdbService from './imdb';
import { createMockEvent } from './test-utils';
import type { AppEvent } from '../app-event';

type MockServices = {
	http: { getHtml: Mock };
	error: { report: Mock };
};

describe('ImdbService', () => {
	let service: ImdbService;
	let mockEvent: AppEvent;
	let mocks: MockServices;

	beforeEach(() => {
		mockEvent = createMockEvent();
		mocks = {
			http: { getHtml: vi.fn() },
			error: { report: vi.fn() }
		};
		mockEvent.locals.services = mocks as unknown as typeof mockEvent.locals.services;
		service = new ImdbService(mockEvent);
	});

	describe('isValidId', () => {
		it('accepts tt ids with 7–12 digits', () => {
			expect(service.isValidId('tt0111161')).toBe(true);
			expect(service.isValidId('tt123456789012')).toBe(true);
		});

		it('rejects series episode ids and junk', () => {
			expect(service.isValidId('tt0111161:1:1')).toBe(false);
			expect(service.isValidId('tt0111161.json')).toBe(false);
			expect(service.isValidId('not-an-id')).toBe(false);
		});
	});

	describe('getTitleById', () => {
		it('extracts and sanitizes the title from the IMDb page', async () => {
			mocks.http.getHtml.mockResolvedValue(
				'<html><head><title>The Shawshank Redemption (1994) - IMDb</title></head></html>'
			);
			await expect(service.getTitleById('tt0111161')).resolves.toBe(
				'The Shawshank Redemption (1994)'
			);
			expect(mocks.error.report).not.toHaveBeenCalled();
		});

		it('falls back to the imdb id when the title tag is missing', async () => {
			// Previously: matchFirstGroup → [] → htmlSanitize(undefined) → "<!-->"
			// which never hit the catch and poisoned torrent search queries.
			mocks.http.getHtml.mockResolvedValue('<html><head><title>IMDb</title></head></html>');
			await expect(service.getTitleById('tt0111161')).resolves.toBe('tt0111161');
			expect(mocks.error.report).toHaveBeenCalled();
		});

		it('falls back to the imdb id when the page has no title element', async () => {
			mocks.http.getHtml.mockResolvedValue('<html><body>blocked</body></html>');
			await expect(service.getTitleById('tt0111161')).resolves.toBe('tt0111161');
			expect(mocks.error.report).toHaveBeenCalled();
		});

		it('falls back when http fetch throws', async () => {
			mocks.http.getHtml.mockRejectedValue(new Error('network down'));
			await expect(service.getTitleById('tt0111161')).resolves.toBe('tt0111161');
			expect(mocks.error.report).toHaveBeenCalled();
		});

		it('rejects invalid id format without calling http', async () => {
			await expect(service.getTitleById('bad')).rejects.toThrow(/invalid imdb id/i);
			expect(mocks.http.getHtml).not.toHaveBeenCalled();
		});
	});

	describe('healthCheck', () => {
		it('is not ok when title extraction fails (id fallback)', async () => {
			mocks.http.getHtml.mockResolvedValue('<html></html>');
			const result = await service.healthCheck();
			expect(result.ok).toBe(false);
		});

		it('is ok when a real title is returned', async () => {
			mocks.http.getHtml.mockResolvedValue('<title>The Shawshank Redemption (1994) - IMDb</title>');
			const result = await service.healthCheck();
			expect(result.ok).toBe(true);
		});
	});
});
