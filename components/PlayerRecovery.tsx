"use client";

import { useEffect, useState } from "react";
import { VideoPlayerModal } from "./VideoPlayerModal";

export function PlayerRecovery() {
  const [playerData, setPlayerData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const pendingPlayer = sessionStorage.getItem('pendingPlayer');
    if (pendingPlayer) {
      try {
        const data = JSON.parse(pendingPlayer);
        setPlayerData(data);
        setIsOpen(true);
      } catch (error) {
        console.error('Erro ao recuperar player pendente:', error);
      }
    }
  }, []);

  if (!playerData) return null;

  return (
    <VideoPlayerModal
      isOpen={isOpen}
      onClose={() => {
        setIsOpen(false);
        sessionStorage.removeItem('pendingPlayer');
      }}
      type={playerData.type}
      tmdbId={playerData.tmdbId}
      title={playerData.title}
      numberOfSeasons={playerData.numberOfSeasons}
      initialSeason={playerData.season}
      initialEpisode={playerData.episode}
      posterPath={playerData.posterPath}
    />
  );
}
