import { NextRequest, NextResponse } from 'next/server';
import { tmdb } from '@/lib/tmdb';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') as 'movie' | 'tv';
  const genreId = parseInt(searchParams.get('genreId') || '0');
  const page = parseInt(searchParams.get('page') || '1');

  if (!type || !genreId) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  try {
    const data = await tmdb.getByGenre(type, genreId, page);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching genre data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
