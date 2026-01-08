import axios from 'axios';

// Stremio addon base URLs
const TORRENTIO_BASE_URL = 'https://torrentio.strem.fun';
const BRAZUCA_BASE_URL = 'https://94c8cb9f702d-brazuca-torrents.baby-beamup.club';

// Public trackers for better peer connectivity
// Public trackers (WSS required for WebTorrent in browser)
// Source: ngosang/trackerslist and other reliable lists (2024-2026)
// Public trackers (WSS required for WebTorrent in browser)
// Source: ngosang/trackerslist and other reliable lists (2024-2026)
const PUBLIC_TRACKERS = [
    'wss://tracker.openwebtorrent.com',
    'wss://tracker.btorrent.xyz',
    'wss://tracker.webtorrent.dev',
    'wss://tracker.webtorrent.dev/announce'
];

export interface StreamSource {
    name: string;
    title: string;
    infoHash?: string;
    magnetLink?: string;
    url?: string;
    quality?: string; // 4K, 1080p, 720p, etc
    size?: string;
    seeds?: number;
    type: 'torrent' | 'http';
    addon: 'torrentio' | 'brazuca';
    isDubbed?: boolean; // Track if content is dubbed
}

export interface StremioStream {
    streams: StreamSource[];
}

/**
 * Enhance magnet link with public trackers
 */
function enhanceMagnetLink(magnetLink: string): string {
    if (!magnetLink || !magnetLink.startsWith('magnet:')) return magnetLink;

    const trackersParam = PUBLIC_TRACKERS.map(t => `&tr=${encodeURIComponent(t)}`).join('');
    return magnetLink + trackersParam;
}

/**
 * Get IMDB ID from TMDB ID
 */
export async function getImdbIdFromTmdb(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<string | null> {
    try {
        const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        const response = await axios.get(
            `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/external_ids`,
            {
                params: { api_key: TMDB_API_KEY }
            }
        );
        return response.data.imdb_id || null;
    } catch (error) {
        console.error('Error fetching IMDB ID:', error);
        return null;
    }
}

/**
 * Parse stream title to extract quality and other metadata
 */
function parseStreamInfo(title: string): { quality: string; size?: string; seeds?: number; isDubbed: boolean } {
    const qualityMatch = title.match(/\b(2160p|4K|1080p|720p|480p|360p)\b/i);
    const sizeMatch = title.match(/💾\s*([\d.]+\s*[GM]B)/i);
    const seedsMatch = title.match(/👤\s*(\d+)/);

    // Check for dubbed content (DUB, DUAL, PORTUGUESE, PT-BR, Dual Áudio, Brazilian flag)
    const isDubbed = /\b(DUB|DUBLADO|DUAL|PORTUGUESE|PT-BR|Dual Áudio)\b/i.test(title) || /🇧🇷/.test(title);

    return {
        quality: qualityMatch ? qualityMatch[1].toUpperCase() : 'Unknown',
        size: sizeMatch ? sizeMatch[1] : undefined,
        seeds: seedsMatch ? parseInt(seedsMatch[1]) : undefined,
        isDubbed,
    };
}

/**
 * Fetch streams from a specific addon
 */
export async function getStreamsFromAddon(
    addon: 'torrentio' | 'brazuca',
    tmdbId: number,
    mediaType: 'movie' | 'tv',
    season?: number,
    episode?: number
): Promise<StreamSource[]> {
    try {
        const imdbId = await getImdbIdFromTmdb(tmdbId, mediaType);

        if (!imdbId) {
            console.error('No IMDB ID found for TMDB ID:', tmdbId);
            return [];
        }

        const baseUrl = addon === 'torrentio' ? TORRENTIO_BASE_URL : BRAZUCA_BASE_URL;
        let url: string;

        if (mediaType === 'movie') {
            url = `${baseUrl}/stream/movie/${imdbId}.json`;
        } else {
            if (!season || !episode) {
                console.error('Season and episode required for TV shows');
                return [];
            }
            url = `${baseUrl}/stream/series/${imdbId}:${season}:${episode}.json`;
        }

        const response = await axios.get<StremioStream>(url, { timeout: 10000 });

        if (!response.data.streams || response.data.streams.length === 0) {
            return [];
        }

        return response.data.streams.map(stream => {
            const { quality, size, seeds, isDubbed } = parseStreamInfo(stream.title);

            let magnetLink = stream.url;
            if (stream.infoHash && !magnetLink?.startsWith('magnet:')) {
                magnetLink = `magnet:?xt=urn:btih:${stream.infoHash}`;
            }

            // Enhance magnet link with trackers
            if (magnetLink?.startsWith('magnet:')) {
                magnetLink = enhanceMagnetLink(magnetLink);
            }

            return {
                name: addon === 'torrentio' ? 'Torrentio' : 'Brazuca',
                title: stream.title,
                magnetLink: magnetLink?.startsWith('magnet:') ? magnetLink : undefined,
                url: stream.url,
                infoHash: stream.infoHash,
                quality,
                size,
                seeds,
                type: magnetLink?.startsWith('magnet:') ? 'torrent' : 'http',
                addon,
                isDubbed,
            };
        });
    } catch (error) {
        console.error(`Error fetching ${addon} streams:`, error);
        return [];
    }
}

/**
 * Sort streams by quality (highest first) with dubbed content priority
 */
export function sortStreamsByQuality(streams: StreamSource[]): StreamSource[] {
    const qualityOrder: Record<string, number> = {
        '4K': 5,
        '2160P': 5,
        '1080P': 4,
        '720P': 3,
        '480P': 2,
        '360P': 1,
        'UNKNOWN': 0,
    };

    return [...streams].sort((a, b) => {
        // Prioritize dubbed content first
        if (a.isDubbed !== b.isDubbed) {
            return a.isDubbed ? -1 : 1;
        }

        const qualityA = qualityOrder[a.quality?.toUpperCase() || 'UNKNOWN'] || 0;
        const qualityB = qualityOrder[b.quality?.toUpperCase() || 'UNKNOWN'] || 0;

        // Sort by quality
        if (qualityA !== qualityB) {
            return qualityB - qualityA;
        }

        // Then by seeds
        const seedsA = a.seeds || 0;
        const seedsB = b.seeds || 0;
        return seedsB - seedsA;
    });
}

/**
 * Group streams by quality for better UI organization
 */
export function groupStreamsByQuality(streams: StreamSource[]): Record<string, StreamSource[]> {
    const grouped: Record<string, StreamSource[]> = {};

    streams.forEach(stream => {
        const quality = stream.quality || 'Unknown';
        if (!grouped[quality]) {
            grouped[quality] = [];
        }
        grouped[quality].push(stream);
    });

    return grouped;
}

/**
 * Backward compatibility: fetch streams (defaults to Torrentio)
 * @deprecated Use getStreamsFromAddon instead
 */
export async function getStreams(
    tmdbId: number,
    mediaType: 'movie' | 'tv',
    season?: number,
    episode?: number
): Promise<StreamSource[]> {
    return getStreamsFromAddon('torrentio', tmdbId, mediaType, season, episode);
}
