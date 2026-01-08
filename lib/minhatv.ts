import axios from 'axios';

const MINHATV_BASE_URL = 'https://da5f663b4690-minhatv.baby-beamup.club';

export interface MinhaTVMeta {
    id: string;
    name: string;
    type: string;
    poster?: string;
    genres?: string[];
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
 * Fetch TV channels from Minha TV addon
 */
export async function getMinhaTVChannels(): Promise<MinhaTVMeta[]> {
    try {
        const response = await axios.get<MinhaTVCatalog>(
            `${MINHATV_BASE_URL}/catalog/tv/minhatv_channels.json`,
            { timeout: 10000 }
        );

        return response.data.metas || [];
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
        const response = await axios.get<MinhaTVStream>(
            `${MINHATV_BASE_URL}/stream/tv/${channelId}.json`,
            { timeout: 10000 }
        );

        if (response.data.streams && response.data.streams.length > 0) {
            return response.data.streams[0].url;
        }

        return null;
    } catch (error) {
        console.error('Error fetching Minha TV stream:', error);
        return null;
    }
}
