import { describe, it, expect, vi } from 'vitest';
import * as searchModule from './search';

// Mock dependencies
vi.mock('./fetchTorrentsInLinks', () => ({
	fetchTorrentsInLinks: vi.fn()
}));
vi.mock('./getTitleFromIMDB', () => ({
	getTitleFromIMDB: vi.fn()
}));
vi.mock('./search', () => ({
	combined: vi.fn()
}));

describe('getTorrentStreams', () => {
	it('should handle invalid URLs gracefully', async () => {
		// Setup mocks
		vi.mocked(getTitleFromIMDBModule.getTitleFromIMDB).mockResolvedValue('Test Movie');
		vi.mocked(searchModule.combined).mockResolvedValue(['http://example.com']);

		// Mock returning a mix of valid and invalid links
		vi.mocked(fetchTorrentsInLinksModule.fetchTorrentsInLinks).mockResolvedValue([
			'magnet:?xt=urn:btih:1234567890123456789012345678901234567890', // Valid
			'not-a-url' // Invalid
		]);

		// This should not throw
		const streams = await getTorrentStreams('tt1234567');

		// Expect only the valid one to be returned
		expect(streams).toHaveLength(1);
		expect(streams[0].infoHash).toBe('1234567890123456789012345678901234567890');
	});
});
