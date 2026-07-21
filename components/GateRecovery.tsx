"use client";

import { useEffect, useState } from "react";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { TVPlayerModal } from "@/components/TVPlayerModal";
import {
  consumePendingGateContent,
  getGateUnlockParam,
  type GateContentInfo,
} from "@/lib/linkGate";

// Componente global (montado uma vez no layout) responsável por reabrir o
// player correto quando o usuário volta do Link Gate (encurtador). A
// navegação completa até o encurtador e de volta perde todo o estado local
// do React, então os dados do conteúdo ficam salvos no sessionStorage antes
// de sair do site (veja lib/linkGate.ts) e são recuperados aqui.
export function GateRecovery() {
  const [recovered, setRecovered] = useState<GateContentInfo | null>(null);

  useEffect(() => {
    const key = getGateUnlockParam();
    if (!key) return;

    const info = consumePendingGateContent(key);
    if (!info) return;

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
