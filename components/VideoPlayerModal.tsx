"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Loader2, Maximize2, MonitorPlay, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getImageUrl,
  getPlayerUrl,
  tmdb,
  type TVSeasonEpisode,
  type VideoPlayer,
} from "@/lib/tmdb";
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
import { EpisodeWatchControls } from "@/components/EpisodeWatchControls";

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

interface MenuOption<T extends string | number> {
  value: T;
  label: string;
  icon?: string;
}

interface SelectMenuProps<T extends string | number> {
  label: string;
  value: T;
  options: MenuOption<T>[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: T) => void;
  disabled?: boolean;
  loading?: boolean;
  align?: "left" | "right";
  className?: string;
}

function SelectMenu<T extends string | number>({
  label,
  value,
  options,
  open,
  onOpenChange,
  onChange,
  disabled = false,
  loading = false,
  align = "left",
  className = "",
}: SelectMenuProps<T>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        onOpenChange(false);
      }
    };

    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [onOpenChange, open]);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    const updatePosition = () => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const viewportPadding = 8;
      const menuGap = 6;
      const availableWidth = Math.max(window.innerWidth - viewportPadding * 2, 0);
      const width = Math.min(Math.max(rect.width, 280), availableWidth);
      const preferredLeft = align === "right" ? rect.right - width : rect.left;
      const maxLeft = Math.max(viewportPadding, window.innerWidth - width - viewportPadding);
      const left = Math.min(Math.max(preferredLeft, viewportPadding), maxLeft);
      const spaceBelow = window.innerHeight - rect.bottom - menuGap - viewportPadding;
      const spaceAbove = rect.top - menuGap - viewportPadding;
      const placeAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
      const availableHeight = Math.max(placeAbove ? spaceAbove : spaceBelow, 120);

      setMenuStyle({
        position: "fixed",
        zIndex: 12000,
        left,
        width,
        maxWidth: availableWidth,
        maxHeight: Math.min(320, availableHeight),
        ...(placeAbove
          ? { bottom: window.innerHeight - rect.top + menuGap, top: "auto" }
          : { top: rect.bottom + menuGap, bottom: "auto" }),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [align, open]);

  return (
    <div ref={rootRef} className={`relative inline-block max-w-full align-bottom ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-gray-400">{label}</span>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="flex w-max max-w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-purple-500/30 bg-[#07050a] px-3 py-2.5 text-left text-sm text-white outline-none transition-colors hover:border-purple-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex min-w-0 items-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : selected?.icon ? <span>{selected.icon}</span> : null}
          <span className="max-w-[min(28rem,calc(100vw-5rem))] whitespace-normal break-words leading-snug">{loading ? "Carregando..." : selected?.label || "Selecionar"}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && !loading && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          className="isolate overflow-x-hidden overflow-y-auto overscroll-contain rounded-lg border border-purple-500/50 bg-[#07050a] p-1 shadow-2xl shadow-black"
          style={menuStyle}
        >
          {options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                onOpenChange(false);
              }}
              className={`flex w-full min-w-0 items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                option.value === value
                  ? "bg-purple-600 text-white"
                  : "text-gray-300 hover:bg-purple-500/20 hover:text-white"
              }`}
            >
              {option.icon && <span className="shrink-0">{option.icon}</span>}
              <span className="min-w-0 whitespace-normal break-words leading-snug">{option.label}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

const PLAYER_OPTIONS: Array<{ id: VideoPlayer; name: string; icon: string }> = [
  { id: "megaembed", name: "Mega Embed", icon: "🎬" },
  { id: "embedmovies", name: "EmbedMovies", icon: "🔗" },
  { id: "warezcdn", name: "WarezCDN", icon: "🌐" },
  { id: "superflixapi", name: "SuperFlix API", icon: "🎬" },
  { id: "embedplay", name: "EmbedPlay API", icon: "🍿" },
  { id: "2embed", name: "2Embed", icon: "🎞️" },
  { id: "superembed", name: "SuperEmbed", icon: "⭐" },
  { id: "smashystream", name: "Smashy", icon: "💥" },
  { id: "webtorrent", name: "WebTorrent (P2P)", icon: "⚡" },
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

const buildFallbackEpisodes = (count = 10): TVSeasonEpisode[] => Array.from(
  { length: Math.max(count, 1) },
  (_, index) => ({
    id: index + 1,
    episode_number: index + 1,
    name: `Episódio ${index + 1}`,
  }),
);

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
  const [mounted, setMounted] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState(initialEpisode);
  const [seasonCount, setSeasonCount] = useState(Math.max(numberOfSeasons, 1));
  const [episodes, setEpisodes] = useState<TVSeasonEpisode[]>(buildFallbackEpisodes());
  const [isSeriesMetadataLoading, setIsSeriesMetadataLoading] = useState(false);
  const [isEpisodeLoading, setIsEpisodeLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<VideoPlayer>("megaembed");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVidSrcMenuOpen, setIsVidSrcMenuOpen] = useState(false);
  const [isSeasonMenuOpen, setIsSeasonMenuOpen] = useState(false);
  const [isEpisodeMenuOpen, setIsEpisodeMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const { openPlayer, closePlayer } = usePlayer();

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

  const closeAllMenus = useCallback(() => {
    setIsVidSrcMenuOpen(false);
    setIsSeasonMenuOpen(false);
    setIsEpisodeMenuOpen(false);
  }, []);

  const handleModalClose = useCallback(() => {
    closeAllMenus();
    revokeContentUnlock(gateKey);
    onCloseRef.current();
  }, [closeAllMenus, gateKey]);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedSeason(Math.max(initialSeason, 1));
    setSelectedEpisode(Math.max(initialEpisode, 1));
    setSeasonCount(Math.max(numberOfSeasons, 1));
    setEpisodes(buildFallbackEpisodes());
    closeAllMenus();
  }, [closeAllMenus, initialEpisode, initialSeason, isOpen, numberOfSeasons, tmdbId]);

  useEffect(() => {
    if (!isOpen || type !== "tv") return;

    let active = true;
    setIsSeriesMetadataLoading(true);

    void tmdb.getDetails("tv", tmdbId)
      .then((details) => {
        if (!active) return;
        const resolvedCount = Math.max(details.number_of_seasons || numberOfSeasons || 1, 1);
        setSeasonCount(resolvedCount);
        setSelectedSeason((current) => Math.min(Math.max(current, 1), resolvedCount));
      })
      .catch((error) => {
        console.error("Não foi possível carregar as temporadas da série:", error);
      })
      .finally(() => {
        if (active) setIsSeriesMetadataLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, numberOfSeasons, tmdbId, type]);

  useEffect(() => {
    if (!isOpen || type !== "tv") return;

    let active = true;
    setIsEpisodeLoading(true);

    void tmdb.getSeasonDetails(tmdbId, selectedSeason)
      .then((season) => {
        if (!active) return;
        const resolvedEpisodes = season.episodes?.length ? season.episodes : buildFallbackEpisodes();
        setEpisodes(resolvedEpisodes);
        setSelectedEpisode((current) => {
          const episodeNumbers = new Set(resolvedEpisodes.map((episode) => episode.episode_number));
          return episodeNumbers.has(current) ? current : resolvedEpisodes[0]?.episode_number || 1;
        });
      })
      .catch((error) => {
        if (!active) return;
        console.error("Não foi possível carregar os episódios da temporada:", error);
        const fallback = buildFallbackEpisodes();
        setEpisodes(fallback);
        setSelectedEpisode((current) => Math.min(Math.max(current, 1), fallback.length));
      })
      .finally(() => {
        if (active) setIsEpisodeLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, selectedSeason, tmdbId, type]);

  useEffect(() => {
    if (!isOpen) return;

    openPlayer();
    const previouslyFocused = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      closePlayer();
      previouslyFocused?.focus?.();
    };
  }, [closePlayer, isOpen, openPlayer]);

  useEffect(() => {
    if (!isOpen || !rootRef.current) return;

    const modalRoot = rootRef.current;
    const siblings = Array.from(document.body.children).filter((element) => element !== modalRoot);
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
      if (event.key !== "Escape") return;

      if (isVidSrcMenuOpen || isSeasonMenuOpen || isEpisodeMenuOpen) {
        closeAllMenus();
        return;
      }
      handleModalClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeAllMenus, handleModalClose, isEpisodeMenuOpen, isOpen, isSeasonMenuOpen, isVidSrcMenuOpen]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleFullscreen = () => {
    const playerContainer = playerContainerRef.current;
    if (!playerContainer) return;

    if (!document.fullscreenElement) {
      void playerContainer.requestFullscreen().catch((error) => {
        console.error("Não foi possível ativar a tela cheia:", error);
      });
    } else {
      void document.exitFullscreen().catch((error) => {
        console.error("Não foi possível sair da tela cheia:", error);
      });
    }
  };

  const embedUrl = getPlayerUrl(selectedPlayer, type, tmdbId, selectedSeason, selectedEpisode);
  const selectedVidSrc = VIDSRC_OPTIONS.find((player) => player.id === selectedPlayer);
  const seasonOptions = useMemo<MenuOption<number>[]>(() => Array.from(
    { length: Math.max(seasonCount, 1) },
    (_, index) => ({ value: index + 1, label: `Temporada ${index + 1}` }),
  ), [seasonCount]);
  const episodeOptions = useMemo<MenuOption<number>[]>(() => episodes.map((episode) => ({
    value: episode.episode_number,
    label: episode.name && !/^epis[oó]dio\s+\d+$/i.test(episode.name)
      ? `Episódio ${episode.episode_number} · ${episode.name}`
      : `Episódio ${episode.episode_number}`,
  })), [episodes]);
  const vidSrcOptions = useMemo<MenuOption<VideoPlayer>[]>(() => VIDSRC_OPTIONS.map((player) => ({
    value: player.id,
    label: player.name,
    icon: player.icon,
  })), []);

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
    numberOfSeasons: seasonCount,
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

        <div className="relative z-[200] shrink-0 overflow-visible border-b border-purple-500/20 bg-black/95 p-3 sm:p-4">
          <div className="flex flex-col items-stretch gap-4 xl:flex-row xl:items-end">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <MonitorPlay className="h-4 w-4 shrink-0 text-purple-400" />
              <span className="text-sm font-medium text-gray-400">Player:</span>

              {PLAYER_OPTIONS.filter((player) => player.id !== "webtorrent").map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlayer(player.id);
                    closeAllMenus();
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all active:scale-95 ${
                    selectedPlayer === player.id
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                      : "border border-purple-500/30 bg-black/60 text-gray-300 hover:bg-purple-500/20"
                  }`}
                >
                  <span className="mr-1">{player.icon}</span>
                  {player.name}
                </button>
              ))}

              <SelectMenu
                label=""
                value={selectedVidSrc?.id || "vidsrcsbs"}
                options={vidSrcOptions}
                open={isVidSrcMenuOpen}
                onOpenChange={(open) => {
                  setIsVidSrcMenuOpen(open);
                  if (open) {
                    setIsSeasonMenuOpen(false);
                    setIsEpisodeMenuOpen(false);
                  }
                }}
                onChange={(player) => setSelectedPlayer(player)}
                align="right"
                className="w-fit max-w-full [&>span]:hidden"
              />

              <button
                type="button"
                onClick={() => {
                  setSelectedPlayer("webtorrent");
                  closeAllMenus();
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all active:scale-95 ${
                  selectedPlayer === "webtorrent"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                    : "border border-purple-500/30 bg-black/60 text-gray-300 hover:bg-purple-500/20"
                }`}
              >
                ⚡ WebTorrent (P2P)
              </button>
            </div>

            {type === "tv" && selectedPlayer !== "webtorrent" && (
              <div className="flex w-full shrink-0 flex-wrap items-end gap-3 xl:w-auto">
                <SelectMenu
                  label="Temporada"
                  value={selectedSeason}
                  options={seasonOptions}
                  open={isSeasonMenuOpen}
                  onOpenChange={(open) => {
                    setIsSeasonMenuOpen(open);
                    if (open) {
                      setIsVidSrcMenuOpen(false);
                      setIsEpisodeMenuOpen(false);
                    }
                  }}
                  onChange={(season) => {
                    setSelectedSeason(season);
                    setSelectedEpisode(1);
                  }}
                  loading={isSeriesMetadataLoading}
                  className="w-fit max-w-full"
                />
                <SelectMenu
                  label="Episódio"
                  value={selectedEpisode}
                  options={episodeOptions}
                  open={isEpisodeMenuOpen}
                  onOpenChange={(open) => {
                    setIsEpisodeMenuOpen(open);
                    if (open) {
                      setIsVidSrcMenuOpen(false);
                      setIsSeasonMenuOpen(false);
                    }
                  }}
                  onChange={setSelectedEpisode}
                  loading={isEpisodeLoading}
                  align="right"
                  className="w-fit max-w-full"
                />
              </div>
            )}
          </div>
          {type === "tv" && (
            <div className="mt-3 border-t border-white/10 pt-3">
              <EpisodeWatchControls
                seriesId={tmdbId}
                season={selectedSeason}
                episode={selectedEpisode}
                episodeNumbers={episodes.map((item) => item.episode_number)}
                compact
              />
            </div>
          )}
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
                className="h-full w-full border-0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="origin-when-cross-origin"
              />
            )}
          </LinkGate>
        </div>
      </div>
    </div>,
    document.body,
  );
}
