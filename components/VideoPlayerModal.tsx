"use client";

import { useState, useEffect } from "react";
import { X, Maximize2, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { getPlayerUrl, getImageUrl, type VideoPlayer } from "@/lib/tmdb";
import TorrentPlayer from "./TorrentPlayer";
import { usePlayer } from "@/contexts/PlayerContext";

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "movie" | "tv";
  tmdbId: number;
  title: string;
  numberOfSeasons?: number;
  initialSeason?: number;
  initialEpisode?: number;
  posterPath?: string;
}

const PLAYER_OPTIONS = [
  { id: 'megaembed' as VideoPlayer, name: 'Mega Embed', icon: '🎬' },
  { id: 'vidsrc' as VideoPlayer, name: 'VidSrc', icon: '📺' },
  { id: '2embed' as VideoPlayer, name: '2Embed', icon: '🎞️' },
  { id: 'moviesapi' as VideoPlayer, name: 'MoviesAPI', icon: '🎪' },
  { id: 'superembed' as VideoPlayer, name: 'SuperEmbed', icon: '⭐' },
  { id: 'smashystream' as VideoPlayer, name: 'Smashy', icon: '💥' },
  { id: 'webtorrent' as VideoPlayer, name: 'WebTorrent (P2P)', icon: '⚡' },
];

import { useScrollLock } from "@/hooks/useScrollLock";

export function VideoPlayerModal({
  isOpen,
  onClose,
  type,
  tmdbId,
  title,
  numberOfSeasons = 1,
  initialSeason = 1,
  initialEpisode = 1,
  posterPath,
}: VideoPlayerModalProps) {
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState(initialEpisode);
  const [episodeCount, setEpisodeCount] = useState(10);
  const [selectedPlayer, setSelectedPlayer] = useState<VideoPlayer>('megaembed');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { openPlayer, closePlayer } = usePlayer();

  // Atualiza season/episode quando props mudarem
  useEffect(() => {
    setSelectedSeason(initialSeason);
    setSelectedEpisode(initialEpisode);
  }, [initialSeason, initialEpisode]);

  // Notifica contexto quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      openPlayer();
    } else {
      closePlayer();
    }
    
    return () => {
      closePlayer();
    };
  }, [isOpen, openPlayer, closePlayer]);

  // ... inside component ...
  useScrollLock(isOpen);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isOpen]);

  const handleFullscreen = () => {
    const playerContainer = document.getElementById("player-container");
    if (playerContainer) {
      if (!document.fullscreenElement) {
        playerContainer.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const embedUrl = getPlayerUrl(selectedPlayer, type, tmdbId, selectedSeason, selectedEpisode);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-6xl bg-black/95 rounded-xl overflow-hidden shadow-2xl border border-purple-500/30 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/50 to-transparent">
          <h2 className="text-xl font-bold text-white truncate pr-4">{title}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
              className="hover:bg-purple-500/20 transition-all active:scale-95"
              title="Tela Cheia"
            >
              <Maximize2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-purple-500/20 transition-all active:scale-95"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Player Selection & Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-black/50 border-b border-purple-500/20">
          {/* Player Selection */}
          <div className="flex items-center gap-2 flex-wrap">
            <MonitorPlay className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-400 font-medium">Player:</span>
            {PLAYER_OPTIONS.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${selectedPlayer === player.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-black/60 text-gray-300 hover:bg-purple-500/20 border border-purple-500/30'
                  }`}
              >
                <span className="mr-1">{player.icon}</span>
                {player.name}
              </button>
            ))}
          </div>

          {/* Season/Episode Selector for TV Shows */}
          {type === "tv" && selectedPlayer !== 'webtorrent' && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400 font-medium">Temporada:</label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  className="bg-black/60 border border-purple-500/30 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none transition-all active:scale-95 cursor-pointer"
                >
                  {Array.from({ length: numberOfSeasons }, (_, i) => i + 1).map((season) => (
                    <option key={season} value={season}>
                      Temporada {season}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400 font-medium">Episódio:</label>
                <select
                  value={selectedEpisode}
                  onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                  className="bg-black/60 border border-purple-500/30 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none transition-all active:scale-95 cursor-pointer"
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
        </div>

        {/* Video Player Container */}
        <div id="player-container" className="relative aspect-video bg-black">
          {selectedPlayer === 'webtorrent' ? (
            <TorrentPlayer
              poster={posterPath ? getImageUrl(posterPath) : undefined}
              tmdbId={tmdbId}
              mediaType={type}
              season={selectedSeason}
              episode={selectedEpisode}
            />
          ) : (
            <iframe
              id="video-player"
              key={embedUrl}
              src={embedUrl}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            />
          )}
        </div>
      </div>
    </div>
  );
}
