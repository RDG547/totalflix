"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Maximize2, MonitorPlay, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImageUrl, getPlayerUrl, type VideoPlayer } from "@/lib/tmdb";
import TorrentPlayer from "./TorrentPlayer";
import { usePlayer } from "@/contexts/PlayerContext";
import { LinkGate } from "@/components/LinkGate";
import {
  buildMovieGateKey,
  buildSeriesGateKey,
  revokeContentUnlock,
  type GateContentInfo,
} from "@/lib/linkGate";
import { ConsumptionTracker } from "@/components/ConsumptionTracker";
import { useScrollLock } from "@/hooks/useScrollLock";

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
  { id: "megaembed" as VideoPlayer, name: "Mega Embed", icon: "🎬" },
  { id: "embedmovies" as VideoPlayer, name: "EmbedMovies", icon: "🔗" },
  { id: "warezcdn" as VideoPlayer, name: "WarezCDN", icon: "🌐" },
  { id: "superflixapi" as VideoPlayer, name: "SuperFlix API", icon: "🎬" },
  { id: "2embed" as VideoPlayer, name: "2Embed", icon: "🎞️" },
  { id: "superembed" as VideoPlayer, name: "SuperEmbed", icon: "⭐" },
  { id: "smashystream" as VideoPlayer, name: "Smashy", icon: "💥" },
  { id: "webtorrent" as VideoPlayer, name: "WebTorrent (P2P)", icon: "⚡" },
];

const VIDSRC_OPTIONS: Array<{ id: VideoPlayer; name: string; icon: string }> = [
  { id: "vidsrcsbs", name: "VidSrc SBS", icon: "🟦" },
  { id: "vidsrcmeRu", name: "VidSrcMe RU", icon: "🇷🇺" },
  { id: "vidsrcmeSu", name: "VidSrcMe SU", icon: "🇺🇳" },
  { id: "vidsrcMeRu", name: "VidSrc-Me RU", icon: "➖" },
  { id: "vidsrcMeSu", name: "VidSrc-Me SU", icon: "🧩" },
  { id: "vidsrcEmbedRu", name: "VidSrc Embed RU", icon: "🟥" },
  { id: "vidsrcEmbedSu", name: "VidSrc Embed SU", icon: "🟪" },
  { id: "vsrcSu", name: "VSrc SU", icon: "🟢" },
  { id: "vidsrcTo", name: "VidSrc.to", icon: "▶️" },
  { id: "vidapi", name: "VidAPI", icon: "🎥" },
];

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
  const [selectedPlayer, setSelectedPlayer] = useState<VideoPlayer>("megaembed");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isVidSrcMenuOpen, setIsVidSrcMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const vidSrcMenuRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const { openPlayer, closePlayer } = usePlayer();
  const episodeCount = 10;

  const gateKey = type === "movie"
    ? buildMovieGateKey(tmdbId)
    : buildSeriesGateKey(tmdbId, selectedSeason, selectedEpisode);

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handleModalClose = useCallback(() => {
    revokeContentUnlock(gateKey);
    onCloseRef.current();
  }, [gateKey]);

  useEffect(() => {
    if (!isOpen) return;

    openPlayer();
    const previouslyFocused = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      closePlayer();
      previouslyFocused?.focus?.();
    };
  }, [isOpen, openPlayer, closePlayer]);

  useEffect(() => {
    if (!isOpen || !rootRef.current) return;

    const modalRoot = rootRef.current;
    const siblings = Array.from(document.body.children).filter(
      (element) => element !== modalRoot,
    );
    const previousState = siblings.map((element) => ({
      inert: (element as HTMLElement).inert,
      ariaHidden: element.getAttribute("aria-hidden"),
    }));

    siblings.forEach((element) => {
      (element as HTMLElement).inert = true;
      element.setAttribute("aria-hidden", "true");
    });

    return () => {
      siblings.forEach((element, index) => {
        (element as HTMLElement).inert = previousState[index].inert;
        const ariaHidden = previousState[index].ariaHidden;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      });
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isVidSrcMenuOpen) {
          setIsVidSrcMenuOpen(false);
          return;
        }
        handleModalClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isVidSrcMenuOpen, handleModalClose]);

  useEffect(() => {
    if (!isVidSrcMenuOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!vidSrcMenuRef.current?.contains(event.target as Node)) {
        setIsVidSrcMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [isVidSrcMenuOpen]);

  useEffect(() => {
    setSelectedSeason(initialSeason);
    setSelectedEpisode(initialEpisode);
  }, [initialSeason, initialEpisode, tmdbId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleFullscreen = () => {
    const playerContainer = playerContainerRef.current;
    if (!playerContainer) return;

    if (!document.fullscreenElement) {
      playerContainer.requestFullscreen().catch((error) => {
        console.error("Não foi possível ativar a tela cheia:", error);
      });
    } else {
      document.exitFullscreen().catch((error) => {
        console.error("Não foi possível sair da tela cheia:", error);
      });
    }
  };

  const embedUrl = getPlayerUrl(
    selectedPlayer,
    type,
    tmdbId,
    selectedSeason,
    selectedEpisode,
  );
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
    <div
      ref={rootRef}
      className="pointer-events-auto fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Fechar player"
        className="absolute inset-0 h-full w-full cursor-default bg-black/90 backdrop-blur-sm"
        onClick={handleModalClose}
      />

      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Player de ${title}`}
        className="relative flex h-[calc(100dvh-1rem)] max-h-[900px] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-purple-500/30 bg-black/95 shadow-2xl sm:h-[calc(100dvh-2rem)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-purple-500/30 bg-gradient-to-r from-purple-900/50 to-transparent p-3 sm:p-4">
          <h2 className="truncate pr-3 text-base font-bold text-white sm:text-xl">{title}</h2>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
              className="transition-all hover:bg-purple-500/20 active:scale-95"
              title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              <Maximize2 className="h-5 w-5" />
            </Button>
            <Button
              ref={closeButtonRef}
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleModalClose}
              className="transition-all hover:bg-purple-500/20 active:scale-95"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="relative z-30 max-h-[44dvh] shrink-0 overflow-x-hidden overflow-y-auto border-b border-purple-500/20 bg-black/50 p-3 sm:p-4 md:overflow-visible">
          <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-start">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <MonitorPlay className="h-4 w-4 shrink-0 text-purple-400" />
              <span className="text-sm font-medium text-gray-400">Player:</span>

              {PLAYER_OPTIONS.filter((player) => player.id !== "webtorrent").map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlayer(player.id);
                    setIsVidSrcMenuOpen(false);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all active:scale-95 ${
                    selectedPlayer === player.id
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/50"
                      : "border border-purple-500/30 bg-black/60 text-gray-300 hover:bg-purple-500/20"
                  }`}
                >
                  <span className="mr-1">{player.icon}</span>
                  {player.name}
                </button>
              ))}

              <div ref={vidSrcMenuRef} className="relative w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsVidSrcMenuOpen((open) => !open)}
                  aria-expanded={isVidSrcMenuOpen}
                  aria-haspopup="menu"
                  className={`flex w-full items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-all active:scale-[0.99] sm:w-auto sm:py-1.5 ${
                    selectedVidSrc
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/50"
                      : "border border-purple-500/30 bg-black/60 text-gray-300 hover:bg-purple-500/20"
                  }`}
                >
                  <span>📺</span>
                  <span className="truncate">{selectedVidSrc?.name || "VidSrc"}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isVidSrcMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {isVidSrcMenuOpen && (
                  <div
                    role="menu"
                    className="relative z-[120] mt-2 max-h-[min(320px,40dvh)] w-full overflow-y-auto overscroll-contain rounded-lg border border-purple-500/30 bg-black/95 p-1 shadow-2xl shadow-black sm:absolute sm:right-0 sm:top-full sm:w-64"
                  >
                    {VIDSRC_OPTIONS.map((player) => (
                      <button
                        key={player.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setSelectedPlayer(player.id);
                          setIsVidSrcMenuOpen(false);
                        }}
                        className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          selectedPlayer === player.id
                            ? "bg-purple-600 text-white"
                            : "text-gray-300 hover:bg-purple-500/20 hover:text-white"
                        }`}
                      >
                        <span className="mr-2">{player.icon}</span>
                        {player.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {PLAYER_OPTIONS.filter((player) => player.id === "webtorrent").map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlayer(player.id);
                    setIsVidSrcMenuOpen(false);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all active:scale-95 ${
                    selectedPlayer === player.id
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/50"
                      : "border border-purple-500/30 bg-black/60 text-gray-300 hover:bg-purple-500/20"
                  }`}
                >
                  <span className="mr-1">{player.icon}</span>
                  {player.name}
                </button>
              ))}
            </div>

            {type === "tv" && selectedPlayer !== "webtorrent" && (
              <div className="grid w-full shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 md:w-auto">
                <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-gray-400">
                  Temporada
                  <select
                    value={selectedSeason}
                    onChange={(event) => {
                      setSelectedSeason(Number(event.target.value));
                      setSelectedEpisode(1);
                    }}
                    className="relative z-40 w-full min-w-0 rounded-lg border border-purple-500/30 bg-black px-3 py-2.5 text-white outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30"
                  >
                    {Array.from({ length: Math.max(numberOfSeasons, 1) }, (_, index) => index + 1).map((season) => (
                      <option key={season} value={season}>
                        Temporada {season}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-gray-400">
                  Episódio
                  <select
                    value={selectedEpisode}
                    onChange={(event) => setSelectedEpisode(Number(event.target.value))}
                    className="relative z-40 w-full min-w-0 rounded-lg border border-purple-500/30 bg-black px-3 py-2.5 text-white outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30"
                  >
                    {Array.from({ length: episodeCount }, (_, index) => index + 1).map((episode) => (
                      <option key={episode} value={episode}>
                        Episódio {episode}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
        </div>

        <div ref={playerContainerRef} className="relative z-0 min-h-0 flex-1 bg-black">
          <LinkGate contentKey={gateKey} label={gateLabel} recoveryInfo={gateRecoveryInfo}>
            <ConsumptionTracker
              type={type}
              contentId={tmdbId}
              itemKey={type === "movie" ? String(tmdbId) : `${tmdbId}:s${selectedSeason}e${selectedEpisode}`}
              title={title}
            />
            {selectedPlayer === "webtorrent" ? (
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
                title={`Player de ${title}`}
                className="h-full w-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              />
            )}
          </LinkGate>
        </div>
      </div>
    </div>,
    document.body,
  );
}
