"use client";

import { useState } from "react";
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

  return (
    <>
      <Button
        size={size}
        className={`glow-effect group transition-all active:scale-95 ${className}`}
        onClick={() => setIsModalOpen(true)}
      >
        <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
        Assistir Agora
      </Button>

      <VideoPlayerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={type}
        tmdbId={tmdbId}
        title={title}
        numberOfSeasons={numberOfSeasons}
        initialSeason={selectedSeason}
        initialEpisode={selectedEpisode}
        posterPath={posterPath}
      />
    </>
  );
}
