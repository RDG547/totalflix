import { TV_CHANNELS } from "@/lib/tv-channels";

export interface TVProviderMeta {
  id: string;
  name: string;
  type: string;
  poster?: string;
  streamUrl?: string;
  genres?: string[];
  provider?: string;
  sources?: Array<{
    id: string;
    provider: string;
    streamUrl: string;
  }>;
}

interface TVProviderCatalog {
  metas: TVProviderMeta[];
}

const normalizeChannelName = (name: string) => name
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("pt-BR")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const getOfficialFallbackChannels = (): TVProviderMeta[] => TV_CHANNELS.map((channel) => ({
  id: `official-${channel.id}`,
  name: channel.name,
  type: "tv",
  poster: channel.logo,
  streamUrl: channel.streamUrl,
  genres: [channel.category],
  provider: "Canal oficial",
  sources: [{
    id: `official-${channel.id}`,
    provider: "Canal oficial",
    streamUrl: channel.streamUrl,
  }],
}));

const mergeChannels = (channels: TVProviderMeta[]): TVProviderMeta[] => {
  const merged = new Map<string, TVProviderMeta>();

  channels.forEach((channel) => {
    if (!channel.name || !channel.streamUrl) return;

    const key = normalizeChannelName(channel.name);
    const incomingSources = channel.sources?.length
      ? channel.sources
      : [{
          id: channel.id,
          provider: channel.provider || "Fonte alternativa",
          streamUrl: channel.streamUrl,
        }];
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, {
        ...channel,
        sources: incomingSources,
      });
      return;
    }

    const seenUrls = new Set((existing.sources || []).map((source) => source.streamUrl));
    const newSources = incomingSources.filter((source) => !seenUrls.has(source.streamUrl));
    existing.sources = [...(existing.sources || []), ...newSources];
    if (!existing.poster && channel.poster) existing.poster = channel.poster;
    if (!existing.genres?.length && channel.genres?.length) existing.genres = channel.genres;
  });

  return Array.from(merged.values());
};

export async function getTVProviderChannels(): Promise<TVProviderMeta[]> {
  const officialChannels = getOfficialFallbackChannels();

  try {
    const response = await fetch("/api/tv-channels", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json() as TVProviderCatalog;
    return mergeChannels([...officialChannels, ...(data.metas || [])]);
  } catch (error) {
    console.error("Error fetching TV provider channels; using official fallback:", error);
    return officialChannels;
  }
}
