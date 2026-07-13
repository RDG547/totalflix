import { NextResponse } from 'next/server';

const EMBED_CHANNELS_URL = 'https://1.embedcanaisdetv.com/';
const REI_DOS_EMBEDS_URL = 'https://reidosembeds.com/api/channels';
const MINHA_TV_URL = 'https://da5f663b4690-minhatv.baby-beamup.club';

interface PublicChannel {
  id: string;
  name: string;
  type: 'tv';
  poster?: string;
  streamUrl: string;
  genres?: string[];
  provider: string;
  sources?: ChannelSource[];
}

interface ChannelSource {
  id: string;
  provider: string;
  streamUrl: string;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function fetchEmbedChannels(): Promise<PublicChannel[]> {
  const response = await fetch(EMBED_CHANNELS_URL, {
    next: { revalidate: 300 },
    headers: { Accept: 'text/html' },
  });
  if (!response.ok) throw new Error(`EmbedCanais returned ${response.status}`);

  const html = await response.text();
  const pattern = /<a\s+aria-label="([^"]+)"\s+class="thumb"\s+href="([^"]*\?canal=([^"/&]+)[^"]*)">[\s\S]*?<img[^>]+src="([^"]+)"/gi;
  const channels = new Map<string, PublicChannel>();

  for (const match of Array.from(html.matchAll(pattern))) {
    const [, rawName, , channelId, rawPoster] = match;
    channels.set(channelId, {
      id: `embedcanais-${channelId}`,
      name: decodeHtml(rawName).trim(),
      type: 'tv',
      poster: new URL(decodeHtml(rawPoster), EMBED_CHANNELS_URL).toString(),
      streamUrl: `https://embedcanaisdetv.xyz/e/index.php?canal=${encodeURIComponent(channelId)}`,
      provider: 'EmbedCanais',
    });
  }
  return Array.from(channels.values());
}

async function fetchReiDosEmbedsChannels(): Promise<PublicChannel[]> {
  const response = await fetch(REI_DOS_EMBEDS_URL, {
    next: { revalidate: 300 },
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Rei dos Embeds returned ${response.status}`);

  const payload = await response.json() as {
    data?: Array<{
      id: string;
      name: string;
      logo_url?: string;
      embed_url?: string;
      category?: string;
      is_active?: boolean;
    }>;
  };

  return (payload.data || [])
    .filter((channel) =>
      channel.is_active === true &&
      Boolean(channel.embed_url)
    )
    .map((channel) => ({
      id: `rei-${channel.id}`,
      name: channel.name,
      type: 'tv' as const,
      poster: channel.logo_url,
      streamUrl: channel.embed_url!,
      genres: channel.category ? [channel.category] : undefined,
      provider: 'Rei dos Embeds',
    }));
}

async function fetchMinhaTVChannels(): Promise<PublicChannel[]> {
  const response = await fetch(`${MINHA_TV_URL}/catalog/tv/minhatv_channels.json`, {
    next: { revalidate: 300 },
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`MinhaTV returned ${response.status}`);

  const payload = await response.json() as {
    metas?: Array<{ id: string; name: string; poster?: string; genres?: string[] }>;
  };

  return (payload.metas || []).map((channel) => ({
    id: `minhatv-${channel.id}`,
    name: channel.name,
    type: 'tv' as const,
    poster: channel.poster,
    streamUrl: `minhatv:${channel.id}`,
    genres: channel.genres,
    provider: 'MinhaTV',
  }));
}

export async function GET() {
  const results = await Promise.allSettled([
    fetchEmbedChannels(),
    fetchReiDosEmbedsChannels(),
    fetchMinhaTVChannels(),
  ]);
  const channels = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);

  results.forEach((result) => {
    if (result.status === 'rejected') console.error('TV provider failed:', result.reason);
  });

  if (!channels.length) {
    return NextResponse.json({ error: 'All channel providers failed', metas: [] }, { status: 502 });
  }

  const groupedChannels = new Map<string, PublicChannel>();
  channels.forEach((channel) => {
    const groupKey = channel.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
    const source: ChannelSource = {
      id: channel.id,
      provider: channel.provider,
      streamUrl: channel.streamUrl,
    };
    const existing = groupedChannels.get(groupKey);

    if (existing) {
      existing.sources = [...(existing.sources || []), source];
      if (!existing.poster && channel.poster) existing.poster = channel.poster;
      if (!existing.genres && channel.genres) existing.genres = channel.genres;
      return;
    }

    groupedChannels.set(groupKey, { ...channel, sources: [source] });
  });

  return NextResponse.json(
    { metas: Array.from(groupedChannels.values()) },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  );
}
