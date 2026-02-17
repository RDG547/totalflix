import { NextResponse } from 'next/server';

const CLICKADILLA_TOKEN = '2b9318b204ed4ab6ba9abd7f5df9d51c';
const CLICKADILLA_BASE_URL = 'https://publishers.clickadilla.com/backend/api/public';

// Cache simples em memória (em produção use Redis)
let spotsCache: any = null;
let cacheTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

export async function GET() {
  try {
    // Verifica cache
    const now = Date.now();
    if (spotsCache && now - cacheTime < CACHE_DURATION) {
      return NextResponse.json(spotsCache);
    }

    // Busca spots do usuário
    const response = await fetch(
      `${CLICKADILLA_BASE_URL}/user-spots?token=${CLICKADILLA_TOKEN}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 1800 }, // Revalida a cada 30 min
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `API responded with status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Processa e filtra apenas spots ativos
    type SpotData = {
      id: any;
      name: any;
      adFormat: any;
      status: any;
      code: any;
      url: any;
    };
    
    const activeSpots: {
      inpage: SpotData[];
      webpush: SpotData[];
      popunder: SpotData[];
      banner: SpotData[];
      timestamp: number;
    } = {
      inpage: [],
      webpush: [],
      popunder: [],
      banner: [],
      timestamp: now,
    };

    if (data && Array.isArray(data)) {
      data.forEach((spot: any) => {
        const spotData = {
          id: spot.id,
          name: spot.name,
          adFormat: spot.ad_format,
          status: spot.status,
          code: spot.code || null,
          url: spot.url || null,
        };

        switch (spot.ad_format?.toLowerCase()) {
          case 'inpage push':
          case 'inpage':
            activeSpots.inpage.push(spotData);
            break;
          case 'webpush':
          case 'push':
            activeSpots.webpush.push(spotData);
            break;
          case 'popunder':
            activeSpots.popunder.push(spotData);
            break;
          case 'banner':
          case 'native':
            activeSpots.banner.push(spotData);
            break;
        }
      });
    }

    // Atualiza cache
    spotsCache = activeSpots;
    cacheTime = now;

    return NextResponse.json(activeSpots);

  } catch (error) {
    console.error('Error fetching Clickadilla active spots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active spots' },
      { status: 500 }
    );
  }
}
