"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserProfile,
  setEpisodeWatched,
  setSeasonWatched,
  type SeriesWatchProgress,
} from "@/lib/userProfile";

interface EpisodeWatchControlsProps {
  seriesId: number;
  season: number;
  episode: number;
  episodeNumbers: number[];
  compact?: boolean;
}

const EMPTY_PROGRESS: SeriesWatchProgress = {
  episodes: [],
  completedSeasons: [],
  updatedAt: 0,
};

export function EpisodeWatchControls({
  seriesId,
  season,
  episode,
  episodeNumbers,
  compact = false,
}: EpisodeWatchControlsProps) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<SeriesWatchProgress>(EMPTY_PROGRESS);
  const [saving, setSaving] = useState<"episode" | "season" | null>(null);

  useEffect(() => {
    if (!user) {
      setProgress(EMPTY_PROGRESS);
      return;
    }
    let active = true;
    void getUserProfile(user.uid).then((profile) => {
      if (active) setProgress(profile?.watchedSeries?.[String(seriesId)] || EMPTY_PROGRESS);
    }).catch((error) => console.error("Não foi possível carregar o progresso da série:", error));
    return () => {
      active = false;
    };
  }, [seriesId, user]);

  const watchedEpisodes = useMemo(() => new Set(progress.episodes || []), [progress.episodes]);
  const currentKey = `${season}:${episode}`;
  const episodeWatched = watchedEpisodes.has(currentKey);
  const seasonWatched = progress.completedSeasons?.includes(season)
    || (episodeNumbers.length > 0 && episodeNumbers.every((value) => watchedEpisodes.has(`${season}:${value}`)));

  if (!user) return null;

  const toggleEpisode = async () => {
    const nextWatched = !episodeWatched;
    setSaving("episode");
    try {
      await setEpisodeWatched(user.uid, seriesId, season, episode, nextWatched);
      setProgress((current) => {
        const episodes = new Set(current.episodes || []);
        nextWatched ? episodes.add(currentKey) : episodes.delete(currentKey);
        return {
          ...current,
          episodes: Array.from(episodes),
          completedSeasons: nextWatched
            ? current.completedSeasons || []
            : (current.completedSeasons || []).filter((value) => value !== season),
          updatedAt: Date.now(),
        };
      });
      toast.success(nextWatched ? "Episódio marcado como assistido." : "Episódio marcado como não assistido.");
    } catch (error) {
      console.error("Não foi possível atualizar o episódio:", error);
      toast.error("Não foi possível salvar o episódio.");
    } finally {
      setSaving(null);
    }
  };

  const toggleSeason = async () => {
    const nextWatched = !seasonWatched;
    setSaving("season");
    try {
      await setSeasonWatched(user.uid, seriesId, season, episodeNumbers, nextWatched);
      setProgress((current) => {
        const episodes = new Set(current.episodes || []);
        episodeNumbers.forEach((value) => {
          const key = `${season}:${value}`;
          nextWatched ? episodes.add(key) : episodes.delete(key);
        });
        const seasons = new Set(current.completedSeasons || []);
        nextWatched ? seasons.add(season) : seasons.delete(season);
        return {
          episodes: Array.from(episodes),
          completedSeasons: Array.from(seasons),
          updatedAt: Date.now(),
        };
      });
      toast.success(nextWatched ? "Temporada marcada como assistida." : "Temporada marcada como não assistida.");
    } catch (error) {
      console.error("Não foi possível atualizar a temporada:", error);
      toast.error("Não foi possível salvar a temporada.");
    } finally {
      setSaving(null);
    }
  };

  const baseClass = compact
    ? "rounded-lg border px-3 py-2 text-xs"
    : "rounded-xl border px-4 py-3 text-sm";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void toggleEpisode()}
        disabled={saving !== null}
        className={`${baseClass} inline-flex items-center gap-2 transition disabled:opacity-50 ${
          episodeWatched
            ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-300"
            : "border-white/15 bg-white/5 text-zinc-300 hover:border-purple-500/40"
        }`}
      >
        {saving === "episode" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {episodeWatched ? "Episódio assistido" : "Marcar episódio"}
      </button>
      <button
        type="button"
        onClick={() => void toggleSeason()}
        disabled={saving !== null || episodeNumbers.length === 0}
        className={`${baseClass} inline-flex items-center gap-2 transition disabled:opacity-50 ${
          seasonWatched
            ? "border-purple-500/40 bg-purple-500/15 text-purple-300"
            : "border-white/15 bg-white/5 text-zinc-300 hover:border-purple-500/40"
        }`}
      >
        {saving === "season" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {seasonWatched ? "Temporada assistida" : "Marcar temporada"}
      </button>
      {!compact && (
        <span className="text-xs text-zinc-500">
          {episodeNumbers.filter((value) => watchedEpisodes.has(`${season}:${value}`)).length} de {episodeNumbers.length} episódios
        </span>
      )}
    </div>
  );
}
