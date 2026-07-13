export interface TVProviderMeta {
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

interface TVProviderCatalog {
    metas: TVProviderMeta[];
}

export async function getTVProviderChannels(): Promise<TVProviderMeta[]> {
    try {
        const response = await fetch('/api/tv-channels', {
            headers: { Accept: 'application/json' },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json() as TVProviderCatalog;
        return data.metas || [];
    } catch (error) {
        console.error('Error fetching TV provider channels:', error);
        return [];
    }
}
