import { NextResponse } from 'next/server';
import { lookup } from 'node:dns/promises';

export const runtime = 'nodejs';

const MINHATV_BASE_URL = 'https://da5f663b4690-minhatv.baby-beamup.club';
const MAX_RETRIES = 2;
const TIMEOUT_MS = 12000; // 12 segundos

async function fetchWithRetry(channelId: string, retries = 0): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(
            `${MINHATV_BASE_URL}/stream/tv/${encodeURIComponent(channelId)}.json`,
            {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                }
            }
        );
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        
        // Se for timeout e ainda tem retries, tenta novamente
        if (error instanceof Error && error.name === 'AbortError' && retries < MAX_RETRIES) {
            console.log(`Retry ${retries + 1} for channel ${channelId}`);
            await new Promise(resolve => setTimeout(resolve, 500)); // Espera 500ms antes de retry
            return fetchWithRetry(channelId, retries + 1);
        }
        
        throw error;
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('id');

    if (!channelId) {
        return NextResponse.json(
            { error: 'Channel ID is required' },
            { status: 400 }
        );
    }

    try {
        const response = await fetchWithRetry(channelId);

        if (!response.ok) {
            return NextResponse.json(
                { error: `API responded with status ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        const streamUrl = data.streams?.[0]?.url;
        if (!streamUrl) {
            return NextResponse.json(
                { error: 'No stream available', streams: [] },
                { status: 404 }
            );
        }

        try {
            await lookup(new URL(streamUrl).hostname);
        } catch {
            return NextResponse.json(
                { error: 'Stream host is unavailable', streams: [] },
                { status: 502 }
            );
        }
        
        // Cache por 60 segundos para evitar requests repetidos
        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            },
        });

    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.error(`Timeout fetching TV stream for ${channelId} after ${MAX_RETRIES} retries`);
            return NextResponse.json(
                { error: 'Request timeout', streams: [] },
                { status: 504 }
            );
        }
        console.error(`Error fetching TV stream for ${channelId}:`, error);
        return NextResponse.json(
            { error: 'Failed to fetch stream', streams: [] },
            { status: 500 }
        );
    }
}
