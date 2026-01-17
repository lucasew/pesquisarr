import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTorrentStreams } from './getTorrentStreams';
import * as fetchTorrentsInLinksModule from './fetchTorrentsInLinks';
import * as getTitleFromIMDBModule from './getTitleFromIMDB';
import * as searchModule from './search';

describe('getTorrentStreams', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('should sanitize title (fix verification)', async () => {
        const maliciousTitle = '<script>alert(1)</script>Movie';
        const magnetLink = `magnet:?xt=urn:btih:1234567890123456789012345678901234567890&dn=${encodeURIComponent(maliciousTitle)}`;

        vi.spyOn(getTitleFromIMDBModule, 'getTitleFromIMDB').mockResolvedValue('Some Movie');
        vi.spyOn(searchModule, 'combined').mockResolvedValue(['http://example.com']);
        vi.spyOn(fetchTorrentsInLinksModule, 'fetchTorrentsInLinks').mockResolvedValue([magnetLink]);

        const streams = await getTorrentStreams('tt1234567');

        expect(streams).toHaveLength(1);
        expect(streams[0].title).toBe('Movie');
    });
});
