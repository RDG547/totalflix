"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { getImageUrl, type Movie, tmdb } from "@/lib/tmdb";
import { Star, Heart, Clock, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { addToFavorites, removeFromFavorites, getUserProfile } from "@/lib/userProfile";
import { updateAchievementProgress, initializeAchievements } from "@/lib/achievements";
import toast from "react-hot-toast";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { getGenreName } from "@/lib/genres";

interface MovieCardProps {
  movie: Movie & { runtime?: number; number_of_seasons?: number };
}

export function MovieCard({ movie }: MovieCardProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loadingTrailer, setLoadingTrailer] = useState(false);
  
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const title = movie.title || movie.name || "";
  const mediaType = (movie.media_type || (movie.title ? "movie" : "tv")) as "movie" | "tv";
  const year = movie.release_date?.split("-")[0] || movie.first_air_date?.split("-")[0];

  const formatRuntime = (minutes?: number) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins}m` : `${mins}m`;
  };

  const checkFavoriteStatus = useCallback(async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setIsFavorite(profile.favorites.includes(movie.id));
      }
    } catch (error) {
      console.error("Erro ao verificar favorito:", error);
    }
  }, [user, movie.id]);

  useEffect(() => {
    if (user) checkFavoriteStatus();
  }, [user, movie.id, checkFavoriteStatus]);

  // Handlers dos botões
  const handleWatchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("[MovieCard] Clicou em Assistir");
    setIsWatchModalOpen(true);
  };

  const handleTrailerClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("[MovieCard] Clicou em Trailer");

    if (trailerKey) {
      setIsTrailerOpen(true);
      return;
    }

    setLoadingTrailer(true);
    try {
      const videos = await tmdb.getVideos(mediaType, movie.id);
      const trailer = videos.find((v: any) => v.type === "Trailer" && v.site === "YouTube") ||
                     videos.find((v: any) => v.site === "YouTube" && v.type === "Trailer") ||
                     videos[0];

      if (trailer?.key) {
        setTrailerKey(trailer.key);
        setIsTrailerOpen(true);
      } else {
        toast.error("Trailer não disponível.");
      }
    } catch (error) {
      console.error("Erro ao carregar trailer:", error);
      toast.error("Erro ao carregar trailer.");
    } finally {
      setLoadingTrailer(false);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("[MovieCard] Clicou em Favorito");
    
    if (!user || isLoading) {
      if (!user) toast.error("Faça login para adicionar favoritos");
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorite) {
        await removeFromFavorites(user.uid, movie.id);
        setIsFavorite(false);
        toast.success("Removido dos favoritos");
        window.dispatchEvent(new CustomEvent('favoriteRemoved', { detail: { movieId: movie.id } }));
      } else {
        await addToFavorites(user.uid, movie.id);
        setIsFavorite(true);
        toast.success("Adicionado aos favoritos");
        window.dispatchEvent(new CustomEvent('favoriteAdded', { detail: { movieId: movie.id } }));
        initializeAchievements(user.uid)
          .then(() => updateAchievementProgress(user.uid, 'favorite'))
          .catch(console.error);
      }
    } catch (error) {
      console.error("Erro ao atualizar favorito:", error);
      toast.error("Erro ao atualizar favorito");
    } finally {
      setIsLoading(false);
    }
  };

  // Hover handlers
  const handleMouseEnter = () => {
    setShowButtons(true);
    hoverTimerRef.current = setTimeout(() => {
      setShowPreview(true);
    }, 2000);
  };

  const handleMouseLeave = () => {
    setShowButtons(false);
    setShowPreview(false);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  };

  return (
    <>
      <div 
        className="relative w-full h-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Container do card com aspect ratio */}
        <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-gray-900">
          
          {/* Imagem de fundo com Link */}
          <Link 
            href={`/details/${mediaType}/${movie.id}`}
            className="block w-full h-full"
            data-no-drag
          >
            <img
              src={getImageUrl(movie.poster_path)}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
              draggable={false}
              loading="lazy"
            />
          </Link>

          {/* Overlay de botões (hover) */}
          {showButtons && !showPreview && (
            <div 
              className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col justify-end p-3 z-10"
              data-no-drag
            >
              <div className="space-y-2 text-center">
                <h3 className="text-white font-bold line-clamp-2 text-sm">{title}</h3>
                
                {/* Metadados em linha única */}
                <div className="flex items-center justify-center gap-1 text-[10px] text-gray-300 whitespace-nowrap overflow-hidden">
                  <span className="flex items-center gap-0.5 text-yellow-400">
                    <Star className="w-3 h-3 fill-current" />
                    {movie.vote_average?.toFixed(1)}
                  </span>
                  <span>•</span>
                  <span>{year}</span>
                  {movie.runtime && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatRuntime(movie.runtime)}
                      </span>
                    </>
                  )}
                </div>

                {/* Botões */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleWatchClick}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2 rounded flex items-center justify-center gap-1 transition-colors"
                    data-no-drag
                  >
                    <Play className="w-3 h-3" />
                    Assistir
                  </button>
                  <button
                    onClick={handleTrailerClick}
                    disabled={loadingTrailer}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold py-2 rounded flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                    data-no-drag
                  >
                    {loadingTrailer ? "..." : "Trailer"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Overlay de preview (descrição) com animação slide */}
          <div 
            className={`absolute inset-0 bg-black/90 backdrop-blur-md p-4 flex flex-col z-20 transition-transform duration-500 ease-out ${
              showPreview ? 'translate-y-0' : 'translate-y-full'
            }`}
            data-no-drag
          >
            <div className="mt-6 flex-1 overflow-y-auto">
              <h3 className="text-white font-bold text-sm mb-2">{title}</h3>
              <div className="flex flex-wrap gap-1 mb-2">
                {movie.genre_ids?.slice(0, 3).map(id => (
                  <span key={id} className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">
                    {getGenreName(id)}
                  </span>
                ))}
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">
                {movie.overview || "Sem descrição disponível."}
              </p>
            </div>
          </div>

          {/* Tag Filme/Série */}
          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase z-10 ${
            mediaType === "movie" ? "bg-blue-600" : "bg-red-600"
          }`}>
            <span className="text-white">{mediaType === "movie" ? "Filme" : "Série"}</span>
          </div>

          {/* Botão Favorito */}
          {user && (
            <button
              onClick={handleFavoriteClick}
              disabled={isLoading}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 p-1.5 rounded-full transition-all hover:scale-110 z-10"
              data-no-drag
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "text-red-500 fill-red-500" : "text-white"}`} />
            </button>
          )}
        </div>
      </div>

      {/* Modal de Assistir */}
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

      {/* Modal de Trailer */}
      {isTrailerOpen && trailerKey && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setIsTrailerOpen(false)}
        >
          <div className="relative w-full max-w-5xl aspect-video">
            <button
              onClick={() => setIsTrailerOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-purple-400"
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
            />
          </div>
        </div>
      )}
    </>
  );
}
