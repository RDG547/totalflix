import { NextResponse } from "next/server";

const EMBED_CHANNELS_URL = "https://1.embedcanaisdetv.com/";
const REI_DOS_EMBEDS_URL = "https://reidosembeds.online/api/channels";
const REI_DOS_CANAIS_URL = "https://api.reidoscanais.st/channels";
const PROVIDER_TIMEOUT_MS = 10_000;

interface ChannelSource {
  id: string;
  provider: string;
  streamUrl: string;
  quality?: string;
}

interface PublicChannel {
  id: string;
  name: string;
  type: "tv";
  poster?: string;
  streamUrl: string;
  genres?: string[];
  provider: string;
  sources?: ChannelSource[];
}

interface ProviderResult {
  provider: string;
  channels: PublicChannel[];
}

const normalizeText = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("pt-BR")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const ADULT_TERMS = [
  "adulto",
  "adult",
  "xxx",
  "sexy hot",
  "sex prive",
  "sexprive",
  "sextreme",
  "playboy",
  "penthouse",
  "venus",
  "dream sex",
  "jenny live",
];

const isAdultChannel = (channel: Pick<PublicChannel, "name" | "genres">) => {
  const searchable = normalizeText([channel.name, ...(channel.genres || [])].join(" "));
  return ADULT_TERMS.some((term) => searchable.includes(normalizeText(term)));
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit & { next?: { revalidate: number } } = {},
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchEmbedChannels(): Promise<ProviderResult> {
  const response = await fetchWithTimeout(EMBED_CHANNELS_URL, {
    next: { revalidate: 300 },
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0 (compatible; TotalFlix/1.0)",
    },
  });
  if (!response.ok) throw new Error(`EmbedCanais returned ${response.status}`);

  const html = await response.text();
  const pattern = /<a\s+aria-label="([^"]+)"\s+class="thumb"\s+href="([^"]*\?canal=([^"/&]+)[^"]*)">[\s\S]*?<img[^>]+src="([^"]+)"/gi;
  const channels = new Map<string, PublicChannel>();

  for (const match of Array.from(html.matchAll(pattern))) {
    const [, rawName, rawHref, channelId, rawPoster] = match;
    const streamUrl = new URL(decodeHtml(rawHref), EMBED_CHANNELS_URL).toString();
    const channel: PublicChannel = {
      id: `embedcanais-${channelId}`,
      name: decodeHtml(rawName).trim(),
      type: "tv",
      poster: new URL(decodeHtml(rawPoster), EMBED_CHANNELS_URL).toString(),
      streamUrl,
      provider: "EmbedCanais",
      sources: [{
        id: `embedcanais-${channelId}`,
        provider: "EmbedCanais",
        streamUrl,
      }],
    };

    if (!isAdultChannel(channel)) channels.set(channelId, channel);
  }

  return { provider: "EmbedCanais", channels: Array.from(channels.values()) };
}

async function fetchReiDosEmbedsChannels(): Promise<ProviderResult> {
  const response = await fetchWithTimeout(REI_DOS_EMBEDS_URL, {
    next: { revalidate: 300 },
    headers: { Accept: "application/json" },
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

  const channels = (Array.isArray(payload.data) ? payload.data : [])
    .filter((channel) => channel.is_active !== false && Boolean(channel.embed_url))
    .map((channel): PublicChannel => ({
      id: `rei-embeds-${channel.id}`,
      name: channel.name,
      type: "tv",
      poster: channel.logo_url,
      streamUrl: channel.embed_url!,
      genres: channel.category ? [channel.category] : undefined,
      provider: "Rei dos Embeds",
      sources: [{
        id: `rei-embeds-${channel.id}`,
        provider: "Rei dos Embeds",
        streamUrl: channel.embed_url!,
      }],
    }))
    .filter((channel) => !isAdultChannel(channel));

  return { provider: "Rei dos Embeds", channels };
}

async function fetchReiDosCanaisChannels(): Promise<ProviderResult> {
  const response = await fetchWithTimeout(REI_DOS_CANAIS_URL, {
    next: { revalidate: 300 },
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Rei dos Canais returned ${response.status}`);

  const payload = await response.json() as {
    data?: Array<{
      id: string;
      name: string;
      logo_url?: string;
      category?: string;
      embeds?: Array<{
        provider?: string;
        quality?: string;
        embed_url?: string;
      }>;
    }>;
  };

  const channels = (Array.isArray(payload.data) ? payload.data : [])
    .map((channel): PublicChannel | null => {
      const sources: ChannelSource[] = (channel.embeds || [])
        .filter((embed) => Boolean(embed.embed_url))
        .map((embed, index) => ({
          id: `rei-canais-${channel.id}-${index + 1}`,
          provider: embed.provider
            ? `Rei dos Canais · ${embed.provider}`
            : `Rei dos Canais · Servidor ${index + 1}`,
          quality: embed.quality,
          streamUrl: embed.embed_url!,
        }));

      if (!sources.length) return null;

      return {
        id: `rei-canais-${channel.id}`,
        name: channel.name,
        type: "tv",
        poster: channel.logo_url,
        streamUrl: sources[0].streamUrl,
        genres: channel.category ? [channel.category] : undefined,
        provider: sources[0].provider,
        sources,
      };
    })
    .filter((channel): channel is PublicChannel => Boolean(channel))
    .filter((channel) => !isAdultChannel(channel));

  return { provider: "Rei dos Canais", channels };
}

function groupChannels(channels: PublicChannel[]) {
  const groupedChannels = new Map<string, PublicChannel>();

  channels.forEach((channel) => {
    if (!channel.name || !channel.streamUrl || isAdultChannel(channel)) return;

    const groupKey = normalizeText(channel.name);
    const incomingSources = channel.sources?.length
      ? channel.sources
      : [{
          id: channel.id,
          provider: channel.provider,
          streamUrl: channel.streamUrl,
        }];
    const existing = groupedChannels.get(groupKey);

    if (!existing) {
      groupedChannels.set(groupKey, {
        ...channel,
        sources: incomingSources,
      });
      return;
    }

    const knownUrls = new Set((existing.sources || []).map((source) => source.streamUrl));
    const uniqueSources = incomingSources.filter((source) => !knownUrls.has(source.streamUrl));
    existing.sources = [...(existing.sources || []), ...uniqueSources];
    if (!existing.poster && channel.poster) existing.poster = channel.poster;
    if (!existing.genres?.length && channel.genres?.length) existing.genres = channel.genres;
  });

  return Array.from(groupedChannels.values());
}

export async function GET() {
  const providers = [
    fetchReiDosCanaisChannels,
    fetchReiDosEmbedsChannels,
    fetchEmbedChannels,
  ];
  const results = await Promise.allSettled(providers.map((provider) => provider()));
  const fulfilled = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  const channels = groupChannels(fulfilled.flatMap((result) => result.channels));

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`TV provider ${index + 1} failed:`, result.reason);
    }
  });

  if (!channels.length) {
    return NextResponse.json(
      { error: "All channel providers failed", metas: [] },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      metas: channels,
      providers: fulfilled.map((result) => ({
        name: result.provider,
        channelCount: result.channels.length,
      })),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
