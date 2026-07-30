"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X, Maximize2, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { getPlayerUrl, getImageUrl, type VideoPlayer } from "@/lib/tmdb";
import TorrentPlayer from "./TorrentPlayer";
import { usePlayer } from "@/contexts/PlayerContext";
import { LinkGate } from "@/components/LinkGate";
import { buildMovieGateKey, buildSeriesGateKey, revokeContentUnlock, type GateContentInfo } from "@/lib/linkGate";
import { ConsumptionTracker } from "@/components/ConsumptionTracker";

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
  { id: 'embedmovies' as VideoPlayer, name: 'EmbedMovies', icon: '🔗' },
  { id: 'warezcdn' as VideoPlayer, name: 'WarezCDN', icon: '🌐' },
  { id: 'superflixapi' as VideoPlayer, name: 'SuperFlix API', icon: '🎬' },
  { id: '2embed' as VideoPlayer, name: '2Embed', icon: '🎞️' },
  { id: 'superembed' as VideoPlayer, name: 'SuperEmbed', icon: '⭐' },
  { id: 'smashystream' as VideoPlayer, name: 'Smashy', icon: '💥' },
  { id: 'webtorrent' as VideoPlayer, name: 'WebTorrent (P2P)', icon: '⚡' },
];

const VIDSRC_OPTIONS: Array<{ id: VideoPlayer; name: string; icon: string }> = [
  { id: 'vidsrcsbs', name: 'VidSrc SBS', icon: '🟦' },
  { id: 'vidsrcmeRu', name: 'VidSrcMe RU', icon: '🇷🇺' },
  { id: 'vidsrcmeSu', name: 'VidSrcMe SU', icon: '🇺🇳' },
  { id: 'vidsrcMeRu', name: 'VidSrc-Me RU', icon: '➖' },
  { id: 'vidsrcMeSu', name: 'VidSrc-Me SU', icon: '🧩' },
  { id: 'vidsrcEmbedRu', name: 'VidSrc Embed RU', icon: '🟥' },
  { id: 'vidsrcEmbedSu', name: 'VidSrc Embed SU', icon: '🟪' },
  { id: 'vsrcSu', name: 'VSrc SU', icon: '🟢' },
  { id: 'vidsrcTo', name: 'VidSrc.to', icon: '▶️' },
  { id: 'vidapi', name: 'VidAPI', icon: '🎥' },
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
  const [mounted, setMounted] = useState(false);
  const [isVidSrcMenuOpen, setIsVidSrcMenuOpen] = useState(false);
  const vidSrcMenuRef = useRef<HTMLDivElement>(null);
  const { openPlayer, closePlayer } = usePlayer();

  const gateKey = type === "movie"
    ? buildMovieGateKey(tmdbId)
    : buildSeriesGateKey(tmdbId, selectedSeason, selectedEpisode);

  const handleModalClose = () => {
    revokeContentUnlock(gateKey);
    onClose();
  };

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isVidSrcMenuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!vidSrcMenuRef.current?.contains(event.target as Node)) setIsVidSrcMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsVidSrcMenuOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isVidSrcMenuOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const modalRoot = document.querySelector('[data-player-modal-root]');
    const siblings = Array.from(document.body.children).filter((element) => element !== modalRoot);
    const previousAria = siblings.map((element) => element.getAttribute('aria-hidden'));

    siblings.forEach((element) => {
      (element as HTMLElement).inert = true;
      element.setAttribute('aria-hidden', 'true');
    });

    return () => {
      siblings.forEach((element, index) => {
        (element as HTMLElement).inert = false;
        const ariaValue = previousAria[index];
        if (ariaValue === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', ariaValue);
      });
    };
  }, [isOpen]);

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
  const selectedVidSrc = VIDSRC_OPTIONS.find((player) => player.id === selectedPlayer);

  const gateLabel = type === "movie"
    ? "este filme"
    : `o episódio ${selectedEpisode} da temporada ${selectedSeason}`;
  const gateRecoveryInfo: GateContentInfo = {
    kind: "video",
    key: gateKey,
    type,
    tmdbId,
    season: selectedSeason,
    episode: selectedEpisode,
    title,
    numberOfSeasons,
    posterPath,
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div data-player-modal-root className="pointer-events-auto fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={handleModalClose}
      />

      {/* Modal */}
      <div onPointerDown={(event) => event.stopPropagation()} className="relative flex h-[calc(100dvh-1rem)] sm:h-[calc(100dvh-2rem)] max-h-[900px] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-purple-500/30 bg-black/95 shadow-2xl animate-in zoom-in-95 duration-200">
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
              onClick={handleModalClose}
              className="hover:bg-purple-500/20 transition-all active:scale-95"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Player Selection & Controls */}
        <div className="relative z-20 max-h-[34dvh] shrink-0 overflow-visible bg-black/50 p-3 sm:p-4 border-b border-purple-500/20">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Player Selection */}
          <div className="flex items-center gap-2 flex-wrap">
            <MonitorPlay className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-400 font-medium">Player:</span>
            {PLAYER_OPTIONS.filter((player) => player.id !== 'webtorrent').map((player) => (
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
            <div ref={vidSrcMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsVidSrcMenuOpen((open) => !open)}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all active:scale-95 ${selectedVidSrc
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'border border-purple-500/30 bg-black/60 text-gray-300 hover:bg-purple-500/20'
                  }`}
              >
                <span>📺</span>
                {selectedVidSrc?.name || 'VidSrc'}
                <ChevronDown className={`h-4 w-4 transition-transform ${isVidSrcMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isVidSrcMenuOpen && (
                <div className="absolute right-0 top-full z-[100] mt-2 max-h-[min(320px,45dvh)] min-w-52 overflow-y-auto overscroll-contain rounded-lg border border-purple-500/30 bg-black/95 p-1 shadow-2xl shadow-black">
                  {VIDSRC_OPTIONS.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlayer(player.id);
                        setIsVidSrcMenuOpen(false);
                      }}
                      className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${selectedPlayer === player.id
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-purple-500/20 hover:text-white'
                        }`}
                    >
                      <span className="mr-2">{player.icon}</span>{player.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {PLAYER_OPTIONS.filter((player) => player.id === 'webtorrent').map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${selectedPlayer === player.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-black/60 text-gray-300 hover:bg-purple-500/20 border border-purple-500/30'
                  }`}
              >
                <span className="mr-1">{player.icon}</span>{player.name}
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
        </div>

        {/* Video Player Container */}
        <div id="player-container" className="relative z-0 min-h-0 flex-1 bg-black">
          <LinkGate contentKey={gateKey} label={gateLabel} recoveryInfo={gateRecoveryInfo}>
            <ConsumptionTracker
              type={type}
              contentId={tmdbId}
              itemKey={type === "movie" ? String(tmdbId) : `${tmdbId}:s${selectedSeason}e${selectedEpisode}`}
              title={title}
            />
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
          </LinkGate>
        </div>
      </div>
    </div>,
    document.body
  );
}
