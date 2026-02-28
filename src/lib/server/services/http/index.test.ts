import { describe, it, expect, beforeEach, vi } from 'vitest';
import HttpService from './index';
import { createMockEvent } from '../test-utils';

describe('HttpService', () => {
	let service: HttpService;

	beforeEach(() => {
		service = new HttpService(createMockEvent());
		// Mock global fetch
		global.fetch = vi.fn();
	});

	it('should call fetch with default headers', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			text: () => Promise.resolve('ok')
		} as unknown as Response);

		await service.getHtml('https://example.com');

		expect(fetch).toHaveBeenCalledWith(
			'https://example.com',
			expect.objectContaining({
				headers: expect.objectContaining({
					'User-Agent': expect.any(String),
					Accept: expect.any(String),
					'Sec-Fetch-Dest': 'document'
				}),
				cf: expect.objectContaining({
					cacheTtl: expect.any(Number)
				})
			})
		);
	});

	it('should throw error if response is not ok', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: false,
			statusText: 'Not Found'
		} as unknown as Response);

		await expect(service.getHtml('https://example.com')).rejects.toThrow('Not Found');
	});
});
