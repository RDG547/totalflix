"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { tmdb, type TVSeasonEpisode } from "@/lib/tmdb";
import { EpisodeWatchControls } from "@/components/EpisodeWatchControls";

interface SeasonEpisodeSelectorProps {
  type: "movie" | "tv";
  tmdbId: number;
  title: string;
  numberOfSeasons?: number;
  posterPath?: string;
}

interface SelectorOption {
  value: number;
  label: string;
}

interface EmbeddedDropdownProps {
  label: string;
  value: number;
  options: SelectorOption[];
  open: boolean;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: number) => void;
}

function EmbeddedDropdown({
  label,
  value,
  options,
  open,
  loading = false,
  onOpenChange,
  onChange,
}: EmbeddedDropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false);
    };

    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [onOpenChange, open]);

  return (
    <div ref={rootRef} className="relative inline-block max-w-full">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-purple-300/80">
        {label}
      </span>
      <button
        type="button"
        disabled={loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="flex w-max max-w-full items-center justify-between gap-3 rounded-xl border border-purple-500/35 bg-[#09070d] px-4 py-3 text-left text-sm text-white shadow-lg shadow-black/30 transition hover:border-purple-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:cursor-wait disabled:opacity-60"
      >
        <span className="flex min-w-0 items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-purple-300" />}
          <span className="max-w-[min(30rem,calc(100vw-6rem))] whitespace-normal break-words leading-snug">
            {loading ? "Carregando episódios..." : selected?.label || "Selecionar"}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-purple-300 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !loading && (
        <div
          role="listbox"
          className="absolute left-0 top-[calc(100%+0.5rem)] z-[80] max-h-80 min-w-full overflow-y-auto overscroll-contain rounded-xl border border-purple-500/45 bg-[#09070d] p-1.5 shadow-2xl shadow-black"
          style={{ width: "max-content", maxWidth: "min(34rem, calc(100vw - 2rem))" }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                onOpenChange(false);
              }}
              className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm leading-snug transition-colors ${
                option.value === value
                  ? "bg-purple-600 text-white"
                  : "text-zinc-200 hover:bg-purple-500/20 hover:text-white"
              }`}
            >
              <span className="whitespace-normal break-words">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const fallbackEpisodes = (): TVSeasonEpisode[] => Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  episode_number: index + 1,
  name: `Episódio ${index + 1}`,
}));

const episodeLabel = (episode: TVSeasonEpisode) => {
  const name = episode.name?.trim();
  return name && !/^epis[oó]dio\s+\d+$/i.test(name)
    ? `Episódio ${episode.episode_number} · ${name}`
    : `Episódio ${episode.episode_number}`;
};

export function SeasonEpisodeSelector({
  type,
  tmdbId,
  title,
  numberOfSeasons = 1,
  posterPath,
}: SeasonEpisodeSelectorProps) {
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodes, setEpisodes] = useState<TVSeasonEpisode[]>(fallbackEpisodes());
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [openMenu, setOpenMenu] = useState<"season" | "episode" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (type !== "tv") return;

    let active = true;
    setLoadingEpisodes(true);

    void tmdb.getSeasonDetails(tmdbId, selectedSeason)
      .then((season) => {
        if (!active) return;
        const loadedEpisodes = season.episodes?.length ? season.episodes : fallbackEpisodes();
        setEpisodes(loadedEpisodes);
        setSelectedEpisode((current) => (
          loadedEpisodes.some((episode) => episode.episode_number === current)
            ? current
            : loadedEpisodes[0]?.episode_number || 1
        ));
      })
      .catch((error) => {
        if (!active) return;
        console.error("Não foi possível carregar os episódios:", error);
        const fallback = fallbackEpisodes();
        setEpisodes(fallback);
        setSelectedEpisode(1);
      })
      .finally(() => {
        if (active) setLoadingEpisodes(false);
      });

    return () => {
      active = false;
    };
  }, [selectedSeason, tmdbId, type]);

  const seasonOptions = useMemo<SelectorOption[]>(() => Array.from(
    { length: Math.max(numberOfSeasons, 1) },
    (_, index) => ({ value: index + 1, label: `Temporada ${index + 1}` }),
  ), [numberOfSeasons]);

  const episodeOptions = useMemo<SelectorOption[]>(() => episodes.map((episode) => ({
    value: episode.episode_number,
    label: episodeLabel(episode),
  })), [episodes]);

  if (type !== "tv") return null;

  return (
    <div className="relative mt-8 mb-8 overflow-visible rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/35 via-[#08060b] to-black p-4 shadow-2xl shadow-black/30 sm:p-5">
      <div className="mb-5">
        <p className="text-sm font-semibold text-purple-300">Selecione onde continuar</p>
        <p className="mt-1 text-sm text-zinc-400">
          Escolha a temporada e o episódio pelo nome completo antes de iniciar o player.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <EmbeddedDropdown
          label="Temporada"
          value={selectedSeason}
          options={seasonOptions}
          open={openMenu === "season"}
          onOpenChange={(open) => setOpenMenu(open ? "season" : null)}
          onChange={(season) => {
            setSelectedSeason(season);
            setSelectedEpisode(1);
          }}
        />

        <EmbeddedDropdown
          label="Episódio"
          value={selectedEpisode}
          options={episodeOptions}
          open={openMenu === "episode"}
          loading={loadingEpisodes}
          onOpenChange={(open) => setOpenMenu(open ? "episode" : null)}
          onChange={setSelectedEpisode}
        />

        <Button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={loadingEpisodes || episodeOptions.length === 0}
          className="h-auto rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:bg-purple-500 active:scale-95"
        >
          <Play className="mr-2 h-4 w-4 fill-current" />
          Assistir episódio {selectedEpisode}
        </Button>
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <EpisodeWatchControls
          seriesId={tmdbId}
          season={selectedSeason}
          episode={selectedEpisode}
          episodeNumbers={episodes.map((item) => item.episode_number)}
        />
      </div>

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
