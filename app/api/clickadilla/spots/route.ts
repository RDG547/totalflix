import { NextResponse } from 'next/server';
import { fetchClickadillaSpots } from '@/lib/clickadilla-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await fetchClickadillaSpots(), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('Error fetching Clickadilla spots:', error);
    return NextResponse.json({ error: 'Failed to fetch spots' }, { status: 500 });
  }
}
