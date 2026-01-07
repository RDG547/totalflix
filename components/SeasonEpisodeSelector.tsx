"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";

interface SeasonEpisodeSelectorProps {
  type: "movie" | "tv";
  tmdbId: number;
  title: string;
  numberOfSeasons?: number;
  posterPath?: string;
}

export function SeasonEpisodeSelector({
  type,
  tmdbId,
  title,
  numberOfSeasons = 1,
  posterPath,
}: SeasonEpisodeSelectorProps) {
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodeCount, setEpisodeCount] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-4 mb-8">
      {/* Season/Episode Selector for TV Shows */}
      {type === "tv" && (
        <div className="flex items-center gap-4 flex-wrap p-4 glass-effect rounded-lg border border-purple-500/30">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300 font-medium">Temporada:</label>
            <select
              value={selectedSeason}
              onChange={(e) => {
                setSelectedSeason(Number(e.target.value));
                setSelectedEpisode(1); // Reset episode when season changes
              }}
              className="bg-black/60 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none transition-all active:scale-95 cursor-pointer min-w-[140px]"
            >
              {Array.from({ length: numberOfSeasons }, (_, i) => i + 1).map((season) => (
                <option key={season} value={season}>
                  Temporada {season}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300 font-medium">Episódio:</label>
            <select
              value={selectedEpisode}
              onChange={(e) => setSelectedEpisode(Number(e.target.value))}
              className="bg-black/60 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none transition-all active:scale-95 cursor-pointer min-w-[140px]"
            >
              {Array.from({ length: episodeCount }, (_, i) => i + 1).map((episode) => (
                <option key={episode} value={episode}>
                  Episódio {episode}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
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
    </div>
  );
}
