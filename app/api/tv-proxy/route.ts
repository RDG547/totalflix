import { NextResponse } from 'next/server';

// Lista de User-Agents para tentar
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'VLC/3.0.18 LibVLC/3.0.18',
  'IPTV Pro/8.0.0',
  'Kodi/20.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json(
            { error: 'URL is required' },
            { status: 400 }
        );
    }

    // Tenta diferentes combinações de headers
    const attempts: { headers: Record<string, string>; referer: string }[] = [
        // Tentativa 1: Headers de navegador comum
        {
            headers: {
                'User-Agent': USER_AGENTS[0],
                'Accept': '*/*',
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache',
            },
            referer: 'https://minhatv.com/',
        },
        // Tentativa 2: Headers de VLC
        {
            headers: {
                'User-Agent': USER_AGENTS[1],
                'Accept': '*/*',
                'Accept-Encoding': 'identity',
                'Connection': 'close',
            },
            referer: '',
        },
        // Tentativa 3: Headers de IPTV Pro
        {
            headers: {
                'User-Agent': USER_AGENTS[2],
                'Accept': 'application/vnd.apple.mpegurl,*/*',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
            },
            referer: 'http://localhost/',
        },
    ];

    let lastError = null;

    for (const attempt of attempts) {
        try {
            const fetchHeaders: Record<string, string> = { ...attempt.headers };
            if (attempt.referer) {
                fetchHeaders['Referer'] = attempt.referer;
            }

            const response = await fetch(url, {
                headers: fetchHeaders,
                redirect: 'follow',
                cache: 'no-store',
            });

            if (!response.ok) {
                lastError = `HTTP ${response.status}`;
                continue;
            }

            const contentType = response.headers.get('content-type') || '';
            const body = await response.text();

            // Verifica se o conteúdo é um playlist M3U8 válido
            if (body.trim().startsWith('#EXTM3U') || body.includes('.m3u8') || body.includes('.ts')) {
                // É um M3U8 válido, processa para substituir URLs relativos
                let processedBody = body;
                
                // Extrai o base URL para resolver URLs relativos
                const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
                
                // Substitui URLs relativos por absolutos (que serão proxyados)
                const lines = body.split('\n');
                const newLines = lines.map(line => {
                    line = line.trim();
                    // Se a linha não é um comentário e não está vazia
                    if (line && !line.startsWith('#')) {
                        // Se é uma URL relativa
                        if (!line.startsWith('http')) {
                            return baseUrl + line;
                        }
                        // Se é uma URL absoluta, não muda
                        return line;
                    }
                    return line;
                });
                processedBody = newLines.join('\n');

                return new NextResponse(processedBody, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/vnd.apple.mpegurl',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, OPTIONS',
                        'Access-Control-Allow-Headers': '*',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                    },
                });
            }

            // Se chegou aqui, o conteúdo não é um M3U8 válido
            lastError = 'Invalid content type';
            
        } catch (error) {
            lastError = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Proxy attempt failed:`, lastError);
        }
    }

    // Todas as tentativas falharam
    return NextResponse.json(
        { error: 'Failed to proxy stream', details: lastError },
        { status: 502 }
    );
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
