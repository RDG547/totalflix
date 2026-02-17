import { NextResponse } from 'next/server';

const MINHATV_BASE_URL = 'https://da5f663b4690-minhatv.baby-beamup.club';

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
        // AbortController com timeout de 8 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

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

        if (!response.ok) {
            return NextResponse.json(
                { error: `API responded with status ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        
        // Cache por 30 segundos para evitar requests repetidos
        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
            },
        });

    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.error(`Timeout fetching TV stream for ${channelId}`);
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
