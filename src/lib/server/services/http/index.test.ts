import { describe, it, expect, beforeEach, vi } from 'vitest';
import HttpService, { HttpFetchError } from './index';
import { createMockEvent } from '../test-utils';

describe('HttpService', () => {
	let service: HttpService;

	beforeEach(() => {
		service = new HttpService(createMockEvent());
		// Mock global fetch
		globalThis.fetch = vi.fn();
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
					cacheTtl: expect.any(Number),
					cacheTtlByStatus: expect.objectContaining({
						'400-499': 0,
						'500-599': 0
					})
				})
			})
		);
	});

	it('should throw error if response is not ok', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: false,
			status: 404,
			statusText: 'Not Found'
		} as unknown as Response);

		await expect(service.getHtml('https://example.com')).rejects.toBeInstanceOf(HttpFetchError);
		await expect(service.getHtml('https://example.com')).rejects.toMatchObject({
			message: 'Failed to fetch HTML: Not Found',
			status: 404,
			transient: false
		});
	});

	it('marks HTTP 429 as a transient HttpFetchError', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: false,
			status: 429,
			statusText: 'Too Many Requests'
		} as unknown as Response);

		await expect(service.getHtml('https://example.com')).rejects.toBeInstanceOf(HttpFetchError);
		await expect(service.getHtml('https://example.com')).rejects.toMatchObject({
			message: 'Failed to fetch HTML: Too Many Requests',
			status: 429,
			transient: true
		});
	});

	it('wraps a dropped connection as a transient HttpFetchError', async () => {
		vi.mocked(fetch).mockRejectedValue(new Error('Network connection lost.'));

		await expect(service.getHtml('https://example.com')).rejects.toMatchObject({
			name: 'HttpFetchError',
			message: 'Failed to fetch HTML: Network connection lost.',
			transient: true,
			status: undefined
		});
	});

	it('wraps a dropped connection while reading the body', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			status: 200,
			text: () => Promise.reject(new Error('Network connection lost.'))
		} as unknown as Response);

		await expect(service.getHtml('https://example.com')).rejects.toMatchObject({
			name: 'HttpFetchError',
			message: 'Failed to fetch HTML: Network connection lost.',
			transient: true
		});
	});

	it('should return the response body from getBuffer', async () => {
		const body = new ArrayBuffer(4);
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			arrayBuffer: () => Promise.resolve(body)
		} as unknown as Response);

		await expect(service.getBuffer('https://example.com/file.torrent')).resolves.toBe(body);
	});

	it('should throw from getBuffer when the response is not ok', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: false,
			status: 403,
			statusText: 'Forbidden'
		} as unknown as Response);

		await expect(service.getBuffer('https://example.com/file.torrent')).rejects.toMatchObject({
			name: 'HttpFetchError',
			message: 'Failed to fetch Buffer: Forbidden',
			status: 403,
			transient: false
		});
	});
});
