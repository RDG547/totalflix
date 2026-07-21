"use client";

import { useState, useCallback } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";

interface WatchButtonProps {
  type: "movie" | "tv";
  tmdbId: number;
  title: string;
  numberOfSeasons?: number;
  selectedSeason?: number;
  selectedEpisode?: number;
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  posterPath?: string;
}

// Dados fixos quando o usuário clica - evita que o modal mude quando o Hero rotaciona
interface FixedPlayerData {
  type: "movie" | "tv";
  tmdbId: number;
  title: string;
  numberOfSeasons?: number;
  selectedSeason: number;
  selectedEpisode: number;
  posterPath?: string;
}

export function WatchButton({
  type,
  tmdbId,
  title,
  numberOfSeasons,
  selectedSeason = 1,
  selectedEpisode = 1,
  size = "lg",
  className = "",
  posterPath,
}: WatchButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fixedData, setFixedData] = useState<FixedPlayerData | null>(null);

  const handleOpenModal = useCallback(() => {
    // Fixa os dados no momento do clique
    setFixedData({
      type,
      tmdbId,
      title,
      numberOfSeasons,
      selectedSeason,
      selectedEpisode,
      posterPath,
    });
    setIsModalOpen(true);
  }, [type, tmdbId, title, numberOfSeasons, selectedSeason, selectedEpisode, posterPath]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    // Limpa os dados fixos após fechar
    setTimeout(() => setFixedData(null), 300);
  }, []);

  // Usa dados fixos se disponíveis, senão usa props atuais
  const playerData = fixedData || {
    type,
    tmdbId,
    title,
    numberOfSeasons,
    selectedSeason,
    selectedEpisode,
    posterPath,
  };

  return (
    <>
      <Button
        size={size}
        className={`glow-effect group transition-all active:scale-95 ${className}`}
        onClick={handleOpenModal}
      >
        <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
        Assistir Agora
      </Button>

      <VideoPlayerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        type={playerData.type}
        tmdbId={playerData.tmdbId}
        title={playerData.title}
        numberOfSeasons={playerData.numberOfSeasons}
        initialSeason={playerData.selectedSeason}
        initialEpisode={playerData.selectedEpisode}
        posterPath={playerData.posterPath}
      />
    </>
  );
}
