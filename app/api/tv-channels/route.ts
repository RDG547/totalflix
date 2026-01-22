import { NextResponse } from 'next/server';

const MINHATV_BASE_URL = 'https://da5f663b4690-minhatv.baby-beamup.club';

export async function GET() {
  try {
    const response = await fetch(
      `${MINHATV_BASE_URL}/catalog/tv/minhatv_channels.json`,
      {
        next: { revalidate: 300 }, // Cache por 5 minutos
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching TV channels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channels', metas: [] },
      { status: 500 }
    );
  }
}
