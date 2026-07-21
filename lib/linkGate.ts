import type { TVChannel } from "@/lib/tv-channels";

// Chave única de conteúdo usada para saber qual filme/episódio/canal já foi
// liberado pelo usuário através do Link Gate.
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

const UNLOCK_STORAGE_PREFIX = "totalflix:gateUnlocked:";
const PENDING_GATE_STORAGE_KEY = "totalflix:pendingGate";

export function isContentUnlocked(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(UNLOCK_STORAGE_PREFIX + key) === "1";
  } catch {
    return false;
  }
}

export function unlockContent(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UNLOCK_STORAGE_PREFIX + key, "1");
  } catch {
    // localStorage indisponível (modo privado, etc.) — ignora
  }
}

// Verifica se o usuário realmente veio do encurtador (Softurl) antes de
// liberar o conteúdo, dificultando o bypass manual via "?gate_unlock=...".
export function isUnlockReferrerValid(): boolean {
  if (typeof document === "undefined" || !document.referrer) return false;
  try {
    return new URL(document.referrer).hostname.toLowerCase().endsWith("softurl.in");
  } catch {
    return false;
  }
}

export function getGateUnlockParam(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("gate_unlock");
}

export function stripGateUnlockParam(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (!params.has("gate_unlock")) return;
  params.delete("gate_unlock");
  const query = params.toString();
  const newUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", newUrl);
}

export function buildGateUrl(key: string, returnTo: string): string {
  return `/api/linkgate?key=${encodeURIComponent(key)}&returnTo=${encodeURIComponent(returnTo)}`;
}

// Guarda os dados necessários para reabrir o player certo depois que o
// usuário voltar do encurtador (a navegação completa perde o estado do React).
export function savePendingGateContent(info: GateContentInfo): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PENDING_GATE_STORAGE_KEY, JSON.stringify(info));
  } catch {
    // ignora
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
