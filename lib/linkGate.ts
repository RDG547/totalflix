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
const SITE_GRANT_STORAGE_KEY = "totalflix:siteGateGrant";
const PENDING_GATE_STORAGE_KEY = "totalflix:pendingGate";

interface DecodedGrant {
  key?: string;
  scope?: string;
  exp?: number;
}

function decodeGrant(grant: string): DecodedGrant | null {
  try {
    const encoded = grant.split(".")[0];
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as DecodedGrant;
  } catch {
    return null;
  }
}

// O token fica no navegador, mas a autorização sempre é conferida no servidor.
// A validade de 6 horas é assinada pelo backend e não pode ser estendida pelo cliente.
function getSiteGateGrant(): string | null {
  if (typeof window === "undefined") return null;
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      const grant = storage.getItem(SITE_GRANT_STORAGE_KEY);
      if (!grant) continue;
      const payload = decodeGrant(grant);
      if (payload?.scope === "site" && typeof payload.exp === "number" && payload.exp > Date.now()) {
        return grant;
      }
      storage.removeItem(SITE_GRANT_STORAGE_KEY);
    } catch {
      // Pode haver bloqueio de armazenamento por privacidade.
    }
  }
  return null;
}

export function getStoredGateGrant(key: string): string | null {
  if (typeof window === "undefined") return null;
  const siteGrant = getSiteGateGrant();
  if (siteGrant) return siteGrant;
  try {
    return window.sessionStorage.getItem(GRANT_STORAGE_PREFIX + key);
  } catch {
    return null;
  }
}

export function storeGateGrant(key: string, grant: string): void {
  if (typeof window === "undefined") return;
  const payload = decodeGrant(grant);
  if (payload?.scope === "site" && payload.key === key && typeof payload.exp === "number" && payload.exp > Date.now()) {
    try {
      window.localStorage.setItem(SITE_GRANT_STORAGE_KEY, grant);
      return;
    } catch {
      try {
        window.sessionStorage.setItem(SITE_GRANT_STORAGE_KEY, grant);
      } catch {
        // Sem armazenamento disponível, a concessão vale apenas na página atual.
      }
      return;
    }
  }
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
  } catch {
    // Ignora armazenamento indisponível.
  }
  // Fechar um filme, episódio ou canal não cancela as 6 horas do acesso geral.
  if (!getSiteGateGrant()) notifyGateRevoked(key);
}

export function clearAllContentUnlocks(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SITE_GRANT_STORAGE_KEY);
  } catch {
    // Ignora armazenamento indisponível.
  }
  try {
    window.sessionStorage.removeItem(SITE_GRANT_STORAGE_KEY);
    const keysToRemove: string[] = [];
    for (let index = 0; index < window.sessionStorage.length; index++) {
      const storageKey = window.sessionStorage.key(index);
      if (storageKey?.startsWith(GRANT_STORAGE_PREFIX)) keysToRemove.push(storageKey);
    }
    keysToRemove.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // Ignora armazenamento indisponível.
  }
  notifyGateRevoked("site");
}

export function notifyGateUnlocked(key: string): void {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
  try {
    const channel = new BroadcastChannel("totalflix_gate");
    channel.postMessage({ type: "GATE_GRANT_UPDATED", key: getSiteGateGrant() ? "site" : key });
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
  const payload = decodeGrant(grant);
  return typeof payload?.key === "string" ? payload.key : null;
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
