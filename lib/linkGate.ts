import type { TVChannel } from "@/lib/tv-channels";

export function buildMovieGateKey(tmdbId: number): string {
  return `movie:${tmdbId}`;
}

export function buildSeriesGateKey(tmdbId: number, season: number, episode: number): string {
  return `tv:${tmdbId}:s${season}e${episode}`;
}

export function buildChannelGateKey(channelId: string): string {
  return `tvchannel:${channelId}`;
}

export type GateContentInfo =
  | {
      kind: "video";
      key: string;
      type: "movie" | "tv";
      tmdbId: number;
      season?: number;
      episode?: number;
      title: string;
      numberOfSeasons?: number;
      posterPath?: string;
    }
  | {
      kind: "tvchannel";
      key: string;
      channel: TVChannel;
    };

const GRANT_STORAGE_PREFIX = "totalflix:gateGrant:";
const PENDING_GATE_STORAGE_KEY = "totalflix:pendingGate";

export function getStoredGateGrant(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(GRANT_STORAGE_PREFIX + key);
  } catch {
    return null;
  }
}

export function storeGateGrant(key: string, grant: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(GRANT_STORAGE_PREFIX + key, grant);
  } catch {
    // sessionStorage indisponível.
  }
}

export function revokeContentUnlock(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(GRANT_STORAGE_PREFIX + key);
    notifyGateRevoked(key);
  } catch {
    // Ignora armazenamento indisponível.
  }
}

export function clearAllContentUnlocks(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let index = 0; index < window.sessionStorage.length; index++) {
      const storageKey = window.sessionStorage.key(index);
      if (storageKey?.startsWith(GRANT_STORAGE_PREFIX)) keysToRemove.push(storageKey);
    }
    keysToRemove.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // Ignora armazenamento indisponível.
  }
}

export function notifyGateUnlocked(key: string): void {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
  try {
    const channel = new BroadcastChannel("totalflix_gate");
    channel.postMessage({ type: "GATE_GRANT_UPDATED", key });
    channel.close();
  } catch {
    // BroadcastChannel não suportado.
  }
}

export function notifyGateRevoked(key: string): void {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
  try {
    const channel = new BroadcastChannel("totalflix_gate");
    channel.postMessage({ type: "GATE_REVOKED", key });
    channel.close();
  } catch {
    // BroadcastChannel não suportado.
  }
}

export function getGateGrantParam(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("gate_grant");
}

export function stripGateGrantParam(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (!params.has("gate_grant")) return;
  params.delete("gate_grant");
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
  );
}

export function readGrantKey(grant: string): string | null {
  try {
    const encoded = grant.split(".")[0];
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as { key?: unknown };
    return typeof payload.key === "string" ? payload.key : null;
  } catch {
    return null;
  }
}

export function buildGateUrl(key: string, returnTo: string): string {
  return `/api/linkgate?key=${encodeURIComponent(key)}&returnTo=${encodeURIComponent(returnTo)}`;
}

export function savePendingGateContent(info: GateContentInfo): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PENDING_GATE_STORAGE_KEY, JSON.stringify(info));
  } catch {
    // Ignora.
  }
}

export function consumePendingGateContent(key: string): GateContentInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_GATE_STORAGE_KEY);
    if (!raw) return null;
    const info = JSON.parse(raw) as GateContentInfo;
    if (info.key !== key) return null;
    window.sessionStorage.removeItem(PENDING_GATE_STORAGE_KEY);
    return info;
  } catch {
    return null;
  }
}
