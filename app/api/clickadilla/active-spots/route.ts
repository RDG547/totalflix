import { NextResponse } from 'next/server';
import { fetchClickadillaSpots, type ClickadillaSpot } from '@/lib/clickadilla-server';

export const dynamic = 'force-dynamic';

interface ActiveSpots {
  inpage: ClickadillaSpot[];
  webpush: ClickadillaSpot[];
  popunder: ClickadillaSpot[];
  banner: ClickadillaSpot[];
  video: ClickadillaSpot[];
  timestamp: number;
}

export async function GET() {
  try {
    const spots = await fetchClickadillaSpots();
    const activeSpots: ActiveSpots = {
      inpage: [],
      webpush: [],
      popunder: [],
      banner: [],
      video: [],
      timestamp: Date.now(),
    };

    spots.forEach((spot) => {
      switch (spot.adFormat) {
        case 'inpage push':
        case 'inpage':
        case 'inpage_push':
          activeSpots.inpage.push(spot);
          break;
        case 'webpush':
        case 'push':
          activeSpots.webpush.push(spot);
          break;
        case 'popunder':
          activeSpots.popunder.push(spot);
          break;
        case 'banner':
        case 'native':
          activeSpots.banner.push(spot);
          break;
        case 'video':
        case 'video_overlay':
        case 'instream':
        case 'in_stream':
          activeSpots.video.push(spot);
          break;
      }
    });

    return NextResponse.json(activeSpots, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('Error fetching Clickadilla active spots:', error);
    return NextResponse.json({ error: 'Failed to fetch active spots' }, { status: 500 });
  }
}
