"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getImageUrl, type Movie, tmdb } from "@/lib/tmdb";
import { Card } from "@/components/ui/card";
import { Star, Heart, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { addToFavorites, removeFromFavorites, getUserProfile } from "@/lib/userProfile";
import { updateAchievementProgress, initializeAchievements } from "@/lib/achievements";
import toast from "react-hot-toast";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { getGenreName } from "@/lib/genres";
import { triggerPopunderOnWatch } from "@/lib/popunder";

import { useScrollLock } from "@/hooks/useScrollLock";

interface MovieCardProps {
  movie: Movie & { runtime?: number; number_of_seasons?: number };
}

export function MovieCard({ movie }: MovieCardProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [mobileStage, setMobileStage] = useState(0); // 0: Banner, 1: Buttons, 2: Description
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loadingTrailer, setLoadingTrailer] = useState(false);
  const hoverTimerRef = useState<{ current: NodeJS.Timeout | null }>({ current: null })[0];
  const countdownTimerRef = useState<{ current: NodeJS.Timeout | null }>({ current: null })[0];

  const title = movie.title || movie.name || "";
  const mediaType = (movie.media_type || (movie.title ? "movie" : "tv")) as "movie" | "tv";
  const year = movie.release_date?.split("-")[0] || movie.first_air_date?.split("-")[0];

  // Formatar duração
  const formatRuntime = (minutes?: number) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, movie.id]);

  // Timer do countdown
  useEffect(() => {
    if (showPreview) {
      setCountdown(3);
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            return 0;
          }
          return prev - 1;
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

  const checkFavoriteStatus = async () => {
    if (!user) return;

    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setIsFavorite(profile.favorites.includes(movie.id));
      }
    } catch (error) {
      console.error("Erro ao verificar favorito:", error);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      if (isFavorite) {
        await removeFromFavorites(user.uid, movie.id);
        setIsFavorite(false);
        toast.success("Removido dos favoritos");

        // Disparar evento customizado para atualizar outras páginas
        window.dispatchEvent(new CustomEvent('favoriteRemoved', {
          detail: { movieId: movie.id }
        }));
      } else {
        await addToFavorites(user.uid, movie.id);
        setIsFavorite(true);
        toast.success("Adicionado aos favoritos");

        // Disparar evento customizado para atualizar outras páginas
        window.dispatchEvent(new CustomEvent('favoriteAdded', {
          detail: { movieId: movie.id }
        }));

        // Atualizar conquistas de favoritos (sem bloquear a UI)
        initializeAchievements(user.uid)
          .then(() => updateAchievementProgress(user.uid, 'favorite'))
          .catch((err) => console.error("Erro ao atualizar conquistas:", err));
      }
    } catch (error) {
      console.error("Erro ao atualizar favorito:", error);
      // Reverter estado em caso de erro
      setIsFavorite(!isFavorite);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseEnter = () => {
    hoverTimerRef.current = setTimeout(() => {
      setShowPreview(true);
    }, 2000);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setShowPreview(false);
  };

  const handleWatchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Abre popunder antes de abrir o modal
    triggerPopunderOnWatch();
    
    setIsWatchModalOpen(true);
  };

  const handleTrailerClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
        video.site === "YouTube" &&
        video.type === "Trailer"
      ) || videos[0];

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

  // ... inside component ...
  useScrollLock(isTrailerOpen);

  return (
    <>
      <Link
        href={`/details/${mediaType}/${movie.id}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          // Mobile interaction: 3-stage tap
          // 1. First tap: Show Buttons (Stage 1)
          // 2. Second tap: Show Description (Stage 2)
          // 3. Third tap: Reset (Stage 0)
          if (window.innerWidth < 768) {
            e.preventDefault(); // Prevent navigation on mobile taps on the card background
            if (mobileStage === 0) {
              setMobileStage(1);
            } else if (mobileStage === 1) {
              setMobileStage(2);
            } else {
              setMobileStage(0);
            }
          }
        }}
      >
        <Card className="group relative overflow-hidden bg-transparent border-0 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-100 h-full">
          <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
            <Image
              src={getImageUrl(movie.poster_path)}
              alt={title}
              fill
              className={`object-cover transition-transform duration-300 ${showPreview || mobileStage === 2 ? 'scale-110 blur-sm' : 'group-hover:scale-110'}`}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />

            {/* Overlay on Hover (Standard) - Shows Buttons */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent transition-opacity duration-300 pointer-events-none sm:group-hover:pointer-events-auto ${showPreview || mobileStage === 2 ? '!opacity-0 !pointer-events-none' : (mobileStage === 1 ? '!opacity-100 !pointer-events-auto' : 'opacity-0 sm:group-hover:opacity-100')}`}>
              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3 flex flex-col items-center text-center">
                <h3 className="text-white font-bold line-clamp-2 text-base">
                  {title}
                </h3>

                <div className="flex items-center justify-center gap-2 text-xs w-full">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-semibold">{movie.vote_average?.toFixed(1)}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-300">{year}</span>
                  {mediaType === "movie" && movie.runtime && (
                    <>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center gap-1 text-gray-300">
                        <Clock className="w-3 h-3" />
                        <span>{formatRuntime(movie.runtime)}</span>
                      </div>
                    </>
                  )}
                  {mediaType === "tv" && movie.number_of_seasons && (
                    <>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center gap-1 text-gray-300">
                        <Clock className="w-3 h-3" />
                        <span>{movie.number_of_seasons} {movie.number_of_seasons === 1 ? 'T' : 'Ts'}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <div className="flex flex-row gap-2 w-full justify-center">
                    <button
                      onClick={handleWatchClick}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] sm:text-xs font-semibold py-2 px-1 sm:px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 min-w-0"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      Assistir
                    </button>
                    <button
                      onClick={handleTrailerClick}
                      disabled={loadingTrailer}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-[10px] sm:text-xs font-semibold py-2 px-1 sm:px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 disabled:opacity-50 min-w-0"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {loadingTrailer ? "..." : "Trailer"}
                    </button>
                  </div>

                  <Link
                    href={`/details/${mediaType}/${movie.id}`}
                    className="w-full sm:hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button className={`w-full text-white text-xs font-semibold py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 ${mediaType === 'movie'
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20'
                      : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20'
                      }`}>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Ver Detalhes
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Preview Overlay (Activated after 2s or Stage 2) - Shows Description */}
            <div className={`absolute inset-0 bg-black/80 backdrop-blur-md p-4 transition-all duration-500 flex flex-col ${showPreview || mobileStage === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>

              <div className="mt-8 flex-1 space-y-3 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-purple-500/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/50">
                <h3 className="text-white font-bold text-sm leading-tight">
                  {title}
                </h3>

                <div className="flex flex-wrap gap-1">
                  {movie.genre_ids?.slice(0, 3).map(id => (
                    <span key={id} className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                      {getGenreName(id)}
                    </span>
                  ))}
                </div>

                <p className="text-gray-300 text-xs leading-relaxed">
                  {movie.overview || "Sem descrição disponível."}
                </p>
              </div>
            </div>

            {/* Media Type Tag */}
            <div className={`absolute top-2 left-2 backdrop-blur-sm px-3 py-1.5 rounded-full z-10 ${mediaType === "movie"
              ? "bg-blue-500/90 shadow-lg shadow-blue-500/50"
              : "bg-red-500/90 shadow-lg shadow-red-500/50"
              }`}>
              <span className="text-white text-xs font-bold uppercase tracking-wide">
                {mediaType === "movie" ? "Filme" : "Série"}
              </span>
            </div>          {/* Favorite Button */}
            {user && (
              <button
                onClick={toggleFavorite}
                disabled={isLoading}
                className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm p-2 rounded-full transition-all hover:scale-110 active:scale-95 disabled:opacity-50 z-20"
                aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${isFavorite ? "text-red-500 fill-red-500" : "text-white"
                    }`}
                />
              </button>
            )}
          </div>
        </Card>
      </Link>

      {/* Video Player Modal */}
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

      {/* Trailer Modal */}
      {isTrailerOpen && trailerKey && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
          onClick={() => setIsTrailerOpen(false)}
        >
          <div className="relative w-full max-w-5xl aspect-video">
            <button
              onClick={() => setIsTrailerOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-purple-400 transition-colors"
              aria-label="Fechar trailer"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <iframe
              className="w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title="Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
