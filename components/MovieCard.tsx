"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getImageUrl, type Movie } from "@/lib/tmdb";
import { Card } from "@/components/ui/card";
import { Star, Heart, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { addToFavorites, removeFromFavorites, getUserProfile } from "@/lib/userProfile";
import { updateAchievementProgress, initializeAchievements } from "@/lib/achievements";
import toast from "react-hot-toast";

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
  const hoverTimerRef = useState<{ current: NodeJS.Timeout | null }>({ current: null })[0];
  const countdownTimerRef = useState<{ current: NodeJS.Timeout | null }>({ current: null })[0];

  const title = movie.title || movie.name || "";
  const mediaType = movie.media_type || (movie.title ? "movie" : "tv");
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

  return (
    <Link
      href={`/details/${mediaType}/${movie.id}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card className="group relative overflow-hidden bg-transparent border-0 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-100 h-full">
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
          <Image
            src={getImageUrl(movie.poster_path)}
            alt={title}
            fill
            className={`object-cover transition-transform duration-300 ${showPreview ? 'scale-110 blur-sm' : 'group-hover:scale-110'}`}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {/* Overlay on Hover (Standard) */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent transition-opacity duration-300 ${showPreview ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
              <h3 className="text-white font-semibold line-clamp-2 text-sm">
                {title}
              </h3>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300">{year}</span>
                  {mediaType === "movie" && movie.runtime && (
                    <>
                      <span className="text-gray-500">•</span>
                      <div className="flex items-center gap-1 text-purple-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatRuntime(movie.runtime)}</span>
                      </div>
                    </>
                  )}
                  {mediaType === "tv" && movie.number_of_seasons && (
                    <>
                      <span className="text-gray-500">•</span>
                      <div className="flex items-center gap-1 text-purple-400">
                        <Clock className="w-3 h-3" />
                        <span>{movie.number_of_seasons} {movie.number_of_seasons === 1 ? 'Temporada' : 'Temporadas'}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-1 text-yellow-400">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{movie.vote_average?.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Overlay (Activated after 2s) */}
          <div className={`absolute inset-0 bg-black/80 backdrop-blur-md p-4 transition-all duration-500 flex flex-col ${showPreview ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
            {/* Countdown Ball */}
            <div className="absolute top-2 right-2 flex items-center justify-center w-8 h-8">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="3"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="3"
                  strokeDasharray={88}
                  strokeDashoffset={88 - (88 * countdown) / 3}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-white">{countdown}</span>
            </div>

            <div className="mt-8 space-y-3 overflow-y-auto no-scrollbar">
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

              <p className="text-gray-300 text-xs line-clamp-6 leading-relaxed">
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
  );
}
