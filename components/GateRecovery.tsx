"use client";

import { useEffect, useState } from "react";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { TVPlayerModal } from "@/components/TVPlayerModal";
import {
  consumePendingGateContent,
  getGateUnlockParam,
  isUnlockReferrerValid,
  notifyGateUnlocked,
  stripGateUnlockParam,
  unlockContent,
  type GateContentInfo,
} from "@/lib/linkGate";

// Componente global (montado uma vez no layout) responsável por reabrir o
// player correto ou fechar a aba do encurtador quando o usuário volta do Link Gate.
export function GateRecovery() {
  const [recovered, setRecovered] = useState<GateContentInfo | null>(null);

  useEffect(() => {
    const key = getGateUnlockParam();
    if (!key) return;

    if (isUnlockReferrerValid()) {
      unlockContent(key);
      notifyGateUnlocked(key);
      stripGateUnlockParam();

      // Tenta fechar a aba se ela foi aberta especificamente para o encurtador
      if (typeof window !== "undefined") {
        try {
          window.close();
        } catch {
          // ignora falha de permissão de fechar janela
        }
      }
    }

    const info = consumePendingGateContent(key);
    if (!info) return;

    // Se a aba não tiver fechado (fallback), abre o player nesta aba
    setRecovered(info);
  }, []);

  if (!recovered) return null;

  if (recovered.kind === "tvchannel") {
    return (
      <TVPlayerModal
        isOpen
        onClose={() => setRecovered(null)}
        channel={recovered.channel}
      />
    );
  }

  return (
    <VideoPlayerModal
      isOpen
      onClose={() => setRecovered(null)}
      type={recovered.type}
      tmdbId={recovered.tmdbId}
      title={recovered.title}
      numberOfSeasons={recovered.numberOfSeasons}
      initialSeason={recovered.season}
      initialEpisode={recovered.episode}
      posterPath={recovered.posterPath}
    />
  );
}
