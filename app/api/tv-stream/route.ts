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
        const response = await fetch(
            `${MINHATV_BASE_URL}/stream/tv/${encodeURIComponent(channelId)}.json`,
            {
                next: { revalidate: 0 }, // Não cachear streams pois podem expirar
                headers: {
                    'Accept': 'application/json',
                }
            }
        );

        if (!response.ok) {
            // Se retornar 404 ou erro, apenas repassa
            return NextResponse.json(
                { error: `API responded with status ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error(`Error fetching TV stream for ${channelId}:`, error);
        return NextResponse.json(
            { error: 'Failed to fetch stream' },
            { status: 500 }
        );
    }
}
