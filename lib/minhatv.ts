import axios from 'axios';

const MINHATV_BASE_URL = 'https://da5f663b4690-minhatv.baby-beamup.club';

export interface MinhaTVMeta {
    id: string;
    name: string;
    type: string;
    poster?: string;
    streamUrl?: string;
    genres?: string[];
    provider?: string;
    sources?: Array<{
        id: string;
        provider: string;
        streamUrl: string;
    }>;
}

export interface MinhaTVCatalog {
    metas: MinhaTVMeta[];
}

export interface MinhaTVStream {
    streams: Array<{
        name?: string;
        title?: string;
        url: string;
        ytId?: string;
    }>;
}

/**
 * Fetch the channels currently published by the embed provider.
 */
export async function getMinhaTVChannels(): Promise<MinhaTVMeta[]> {
    try {
        // Usar API route local para evitar problemas de CORS
        const isClient = typeof window !== 'undefined';
        const baseUrl = isClient ? '' : 'http://localhost:3000';
        const url = `${baseUrl}/api/tv-channels`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data: MinhaTVCatalog = await response.json();
        return data.metas || [];
    } catch (error) {
        console.error('Error fetching Minha TV channels:', error);
        return [];
    }
}

/**
 * Fetch stream URL for a specific channel
 */
export async function getMinhaTVStream(channelId: string): Promise<string | null> {
    try {
        const isClient = typeof window !== 'undefined';
        const baseUrl = isClient ? '' : 'http://localhost:3000';
        const url = `${baseUrl}/api/tv-stream?id=${channelId}`;

        const response = await fetch(url, {
            cache: 'no-store'
        });

        if (!response.ok) return null;

        const data: MinhaTVStream = await response.json();

        if (data.streams && data.streams.length > 0) {
            return data.streams[0].url;
        }

        return null;
    } catch (error) {
        console.error('Error fetching Minha TV stream:', error);
        return null;
    }
}
