"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getImageUrl, type Movie, tmdb } from "@/lib/tmdb";
import { Card } from "@/components/ui/card";
import { Clock, Heart, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { addToFavorites, getUserProfile, removeFromFavorites } from "@/lib/userProfile";
import { initializeAchievements, updateAchievementProgress } from "@/lib/achievements";
import toast from "react-hot-toast";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { TrailerModal } from "@/components/TrailerModal";
import { getGenreName } from "@/lib/genres";

interface MovieCardProps {
  movie: Movie & { runtime?: number; number_of_seasons?: number };
}

export function MovieCard({ movie }: MovieCardProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [mobileStage, setMobileStage] = useState(0);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loadingTrailer, setLoadingTrailer] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const title = movie.title || movie.name || "";
  const mediaType = (movie.media_type || (movie.title ? "movie" : "tv")) as "movie" | "tv";
  const year = movie.release_date?.split("-")[0] || movie.first_air_date?.split("-")[0];

  const formatRuntime = (minutes?: number) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
    return `${mins}m`;
  };

  useEffect(() => {
    if (!user) return;

    const checkFavoriteStatus = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        if (profile) setIsFavorite(profile.favorites.includes(movie.id));
      } catch (error) {
        console.error("Erro ao verificar favorito:", error);
      }
    };

    void checkFavoriteStatus();
  }, [user, movie.id]);

  useEffect(() => {
    if (showPreview) {
      setCountdown(3);
      countdownTimerRef.current = setInterval(() => {
        setCountdown((previous) => {
          if (previous <= 1) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            return 0;
          }
          return previous - 1;
        });
      }, 1000);
    } else {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setCountdown(3);
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [showPreview]);

  useEffect(() => () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  }, []);

  const toggleFavorite = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      if (isFavorite) {
        await removeFromFavorites(user.uid, movie.id);
        setIsFavorite(false);
        toast.success("Removido dos favoritos");
        window.dispatchEvent(new CustomEvent("favoriteRemoved", {
          detail: { movieId: movie.id },
        }));
      } else {
        await addToFavorites(user.uid, movie.id);
        setIsFavorite(true);
        toast.success("Adicionado aos favoritos");
        window.dispatchEvent(new CustomEvent("favoriteAdded", {
          detail: { movieId: movie.id },
        }));
        initializeAchievements(user.uid)
          .then(() => updateAchievementProgress(user.uid, "favorite"))
          .catch((error) => console.error("Erro ao atualizar conquistas:", error));
      }
    } catch (error) {
      console.error("Erro ao atualizar favorito:", error);
      setIsFavorite(!isFavorite);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseEnter = () => {
    hoverTimerRef.current = setTimeout(() => setShowPreview(true), 2000);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setShowPreview(false);
  };

  const prepareForModal = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setShowPreview(false);
    setMobileStage(0);
  };

  const handleWatchClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    prepareForModal();
    setIsWatchModalOpen(true);
  };

  const handleTrailerClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    prepareForModal();

    if (trailerKey) {
      setIsTrailerOpen(true);
      return;
    }

    setLoadingTrailer(true);
    try {
      const videos = await tmdb.getVideos(mediaType, movie.id);
      const trailer = videos.find((video: any) =>
        video.type === "Trailer" &&
        video.site === "YouTube" &&
        (video.iso_639_1 === "pt" || video.iso_639_1 === "en")
      ) || videos.find((video: any) =>
        video.site === "YouTube" && video.type === "Trailer"
      ) || videos.find((video: any) => video.site === "YouTube");

      if (trailer?.key) {
        setTrailerKey(trailer.key);
        setIsTrailerOpen(true);
      } else {
        toast.error("Trailer não disponível para este conteúdo.");
      }
    } catch (error) {
      console.error("Erro ao carregar trailer:", error);
      toast.error("Não foi possível carregar o trailer.");
    } finally {
      setLoadingTrailer(false);
    }
  };

  return (
    <>
      <Link
        href={`/details/${mediaType}/${movie.id}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("[data-direct-details=\"true\"]")) return;

          if (window.innerWidth < 768) {
            event.preventDefault();
            if (mobileStage === 0) setMobileStage(1);
            else if (mobileStage === 1) setMobileStage(2);
            else setMobileStage(0);
          }
        }}
      >
        <Card className="group relative h-full cursor-pointer overflow-hidden border-0 bg-transparent transition-all duration-300 hover:scale-105 active:scale-100">
          <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
            <Image
              src={getImageUrl(movie.poster_path)}
              alt={title}
              fill
              className={`object-cover transition-transform duration-300 ${showPreview || mobileStage === 2 ? "scale-110 blur-sm" : "group-hover:scale-110"}`}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />

            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-0 transition-opacity duration-300 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 ${
              showPreview || mobileStage === 2
                ? "!pointer-events-none !opacity-0"
                : mobileStage === 1
                  ? "!pointer-events-auto !opacity-100"
                  : ""
            }`}>
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center space-y-3 p-4 text-center">
                <h3 className="line-clamp-2 text-base font-bold text-white">{title}</h3>

                <div className="flex w-full items-center justify-center gap-2 text-xs">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-semibold">{movie.vote_average?.toFixed(1)}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-300">{year}</span>
                  {mediaType === "movie" && movie.runtime && (
                    <>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center gap-1 text-gray-300">
                        <Clock className="h-3 w-3" />
                        <span>{formatRuntime(movie.runtime)}</span>
                      </div>
                    </>
                  )}
                  {mediaType === "tv" && movie.number_of_seasons && (
                    <>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center gap-1 text-gray-300">
                        <Clock className="h-3 w-3" />
                        <span>{movie.number_of_seasons} {movie.number_of_seasons === 1 ? "T" : "Ts"}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex w-full flex-col gap-2">
                  <div className="flex w-full flex-row justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleWatchClick}
                      className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg bg-purple-600 px-1 py-2 text-[10px] font-semibold text-white transition-all duration-200 hover:bg-purple-700 sm:px-3 sm:text-xs"
                    >
                      <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      Assistir
                    </button>
                    <button
                      type="button"
                      onClick={handleTrailerClick}
                      disabled={loadingTrailer}
                      className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg bg-gray-700 px-1 py-2 text-[10px] font-semibold text-white transition-all duration-200 hover:bg-gray-600 disabled:opacity-50 sm:px-3 sm:text-xs"
                    >
                      <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {loadingTrailer ? "..." : "Trailer"}
                    </button>
                  </div>

                  <span data-direct-details="true" className={`flex w-full items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-all duration-200 ${
                    mediaType === "movie"
                      ? "bg-blue-600 shadow-lg shadow-blue-900/20 group-hover:bg-blue-700"
                      : "bg-red-600 shadow-lg shadow-red-900/20 group-hover:bg-red-700"
                  }`}>
                    <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Ver Detalhes
                  </span>
                </div>
              </div>
            </div>

            <div className={`absolute inset-0 flex flex-col bg-black/80 p-4 backdrop-blur-md transition-all duration-500 ${
              showPreview || mobileStage === 2
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-full opacity-0"
            }`}>
              <div className="mt-8 flex-1 space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold leading-tight text-white">{title}</h3>
                  {countdown > 0 && showPreview && (
                    <span className="shrink-0 text-[10px] text-gray-500">{countdown}s</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {movie.genre_ids?.slice(0, 3).map((id) => (
                    <span key={id} className="rounded-full border border-purple-500/30 bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300">
                      {getGenreName(id)}
                    </span>
                  ))}
                </div>

                <p className="text-xs leading-relaxed text-gray-300">
                  {movie.overview || "Sem descrição disponível."}
                </p>
              </div>
            </div>

            <div className={`absolute left-2 top-2 z-10 rounded-full px-3 py-1.5 backdrop-blur-sm ${
              mediaType === "movie"
                ? "bg-blue-500/90 shadow-lg shadow-blue-500/50"
                : "bg-red-500/90 shadow-lg shadow-red-500/50"
            }`}>
              <span className="text-xs font-bold uppercase tracking-wide text-white">
                {mediaType === "movie" ? "Filme" : "Série"}
              </span>
            </div>

            {user && (
              <button
                type="button"
                onClick={toggleFavorite}
                disabled={isLoading}
                className="absolute right-2 top-2 z-20 rounded-full bg-black/80 p-2 backdrop-blur-sm transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                <Heart className={`h-4 w-4 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-white"}`} />
              </button>
            )}
          </div>
        </Card>
      </Link>

      <VideoPlayerModal
        isOpen={isWatchModalOpen}
        onClose={() => setIsWatchModalOpen(false)}
        type={mediaType}
        tmdbId={movie.id}
        title={title}
        numberOfSeasons={movie.number_of_seasons}
        initialSeason={1}
        initialEpisode={1}
        posterPath={movie.poster_path}
      />

      <TrailerModal
        isOpen={isTrailerOpen}
        trailerKey={trailerKey}
        title={title}
        onClose={() => setIsTrailerOpen(false)}
      />
    </>
  );
}
