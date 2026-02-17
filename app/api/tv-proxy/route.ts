import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json(
            { error: 'URL is required' },
            { status: 400 }
        );
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://minhatv.com/',
            },
            redirect: 'follow',
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch: ${response.status}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get('content-type') || 'application/vnd.apple.mpegurl';
        const body = await response.text();

        return new NextResponse(body, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Cache-Control': 'no-cache',
            },
        });

    } catch (error) {
        console.error('Error proxying TV stream:', error);
        return NextResponse.json(
            { error: 'Failed to proxy stream' },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': '*',
        },
    });
}
