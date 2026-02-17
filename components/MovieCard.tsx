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
import { useScrollLock } from "@/hooks/useScrollLock";

interface MovieCardProps {
  movie: Movie & { runtime?: number; number_of_seasons?: number };
}

export function MovieCard({ movie }: MovieCardProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [mobileStage, setMobileStage] = useState(0);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loadingTrailer, setLoadingTrailer] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const title = movie.title || movie.name || "";
  const mediaType = (movie.media_type || (movie.title ? "movie" : "tv")) as "movie" | "tv";
  const year = movie.release_date?.split("-")[0] || movie.first_air_date?.split("-")[0];

  const formatRuntime = (minutes?: number) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
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
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, movie.id, checkFavoriteStatus]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    hoverTimerRef.current = setTimeout(() => {
      setShowPreview(true);
    }, 2000);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setShowPreview(false);
    setMobileStage(0);
  };

  const handleWatchClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[MovieCard] Abrindo modal de assistir:", movie.id);
    setIsWatchModalOpen(true);
  };

  const handleTrailerClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[MovieCard] Buscando trailer:", movie.id);

    if (trailerKey) {
      console.log("[MovieCard] Trailer já carregado, abrindo modal");
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
        console.log("[MovieCard] Trailer encontrado:", trailer.key);
        setTrailerKey(trailer.key);
        setIsTrailerOpen(true);
      } else {
        toast.error("Trailer não disponível.");
      }
    } catch (error) {
      console.error("Erro ao carregar trailer:", error);
      toast.error("Não foi possível carregar o trailer.");
    } finally {
      setLoadingTrailer(false);
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
        window.dispatchEvent(new CustomEvent('favoriteRemoved', { detail: { movieId: movie.id } }));
      } else {
        await addToFavorites(user.uid, movie.id);
        setIsFavorite(true);
        toast.success("Adicionado aos favoritos");
        window.dispatchEvent(new CustomEvent('favoriteAdded', { detail: { movieId: movie.id } }));
        initializeAchievements(user.uid)
          .then(() => updateAchievementProgress(user.uid, 'favorite'))
          .catch((err) => console.error("Erro ao atualizar conquistas:", err));
      }
    } catch (error) {
      console.error("Erro ao atualizar favorito:", error);
      setIsFavorite(!isFavorite);
    } finally {
      setIsLoading(false);
    }
  };

  // Determinar o que mostrar
  const showButtonsOverlay = isHovering && !showPreview;
  const showPreviewOverlay = showPreview;

  useScrollLock(isTrailerOpen);

  // Log para debug
  useEffect(() => {
    console.log("[MovieCard] Modais state:", { isWatchModalOpen, isTrailerOpen });
  }, [isWatchModalOpen, isTrailerOpen]);

  return (
    <>
      <div 
        ref={cardRef}
        className="group relative w-full h-full select-none"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Link para detalhes - cobre o card inteiro quando não há overlay ativo */}
        <Link 
          href={`/details/${mediaType}/${movie.id}`}
          className={`block relative w-full aspect-[2/3] rounded-lg overflow-hidden transition-transform duration-200 ease-out ${!showButtonsOverlay && !showPreviewOverlay ? 'hover:scale-105' : ''}`}
          draggable={false}
          onClick={(e) => {
            // Mobile: 3-stage tap
            if (window.innerWidth < 768) {
              if (mobileStage === 0) {
                e.preventDefault();
                setMobileStage(1);
              } else if (mobileStage === 1) {
                e.preventDefault();
                setMobileStage(2);
              } else {
                setMobileStage(0);
              }
            }
          }}
        >
          {/* Imagem usando img nativo para evitar timeout do Next.js */}
          <img
            src={getImageUrl(movie.poster_path)}
            alt={title}
            draggable={false}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ${showPreviewOverlay ? 'scale-110 blur-sm' : 'group-hover:scale-110'}`}
          />
        </Link>

        {/* Overlay de botões */}
        <div 
          className={`absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/30 rounded-lg flex flex-col justify-end p-3 transition-opacity duration-300 z-20 ${
            showButtonsOverlay || mobileStage === 1 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="space-y-2 text-center">
            <h3 className="text-white font-bold line-clamp-2 text-sm">
              {title}
            </h3>

            {/* Metadados em uma linha só */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] whitespace-nowrap overflow-hidden">
              <div className="flex items-center gap-0.5 text-yellow-400 shrink-0">
                <Star className="w-3 h-3 fill-current" />
                <span className="font-semibold">{movie.vote_average?.toFixed(1)}</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-gray-300 shrink-0">{year}</span>
              {mediaType === "movie" && movie.runtime && (
                <>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-0.5 text-gray-300 shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex flex-row gap-1.5">
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={handleWatchClick}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-[10px] font-semibold py-1.5 px-1 rounded transition-all flex items-center justify-center gap-1 cursor-pointer select-none"
                >
                  <Play className="w-3 h-3" />
                  Assistir
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={handleTrailerClick}
                  disabled={loadingTrailer}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white text-[10px] font-semibold py-1.5 px-1 rounded transition-all flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer select-none"
                >
                  {loadingTrailer ? "..." : "Trailer"}
                </button>
              </div>

              <Link
                href={`/details/${mediaType}/${movie.id}`}
                className="w-full sm:hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <span className={`block w-full text-white text-[10px] font-semibold py-1.5 px-2 rounded text-center cursor-pointer ${mediaType === 'movie' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  Ver Detalhes
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Preview Overlay (descrição) - com animação de slide */}
        <div 
          className={`absolute inset-0 bg-black/90 backdrop-blur-md p-3 rounded-lg z-30 flex flex-col transition-all duration-500 ease-out ${
            showPreviewOverlay || mobileStage === 2 
              ? 'opacity-100 translate-y-0 pointer-events-auto' 
              : 'opacity-0 translate-y-full pointer-events-none'
          }`}
        >
          <div className="mt-6 flex-1 space-y-2 overflow-y-auto">
            <h3 className="text-white font-bold text-sm">{title}</h3>
            <div className="flex flex-wrap gap-1">
              {movie.genre_ids?.slice(0, 3).map(id => (
                <span key={id} className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
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
        <div className={`absolute top-2 left-2 backdrop-blur-sm px-2 py-1 rounded-full z-10 ${
          mediaType === "movie" ? "bg-blue-500/90" : "bg-red-500/90"
        }`}>
          <span className="text-white text-[10px] font-bold uppercase">
            {mediaType === "movie" ? "Filme" : "Série"}
          </span>
        </div>
        
        {/* Favorite Button */}
        {user && (
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={toggleFavorite}
            disabled={isLoading}
            className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm p-1.5 rounded-full transition-all hover:scale-110 active:scale-95 disabled:opacity-50 z-40 cursor-pointer select-none"
            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Heart className={`w-3.5 h-3.5 transition-colors ${isFavorite ? "text-red-500 fill-red-500" : "text-white"}`} />
          </button>
        )}
      </div>

      {/* Video Player Modal - Renderizado fora do fluxo normal */}
      {isWatchModalOpen && (
        <VideoPlayerModal
          isOpen={true}
          onClose={() => {
            console.log("[MovieCard] Fechando modal de assistir");
            setIsWatchModalOpen(false);
          }}
          type={mediaType}
          tmdbId={movie.id}
          title={title}
          numberOfSeasons={movie.number_of_seasons}
          initialSeason={1}
          initialEpisode={1}
          posterPath={movie.poster_path}
        />
      )}

      {/* Trailer Modal */}
      {isTrailerOpen && trailerKey && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setIsTrailerOpen(false)}
        >
          <div className="relative w-full max-w-5xl aspect-video">
            <button
              onClick={() => setIsTrailerOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-purple-400 cursor-pointer p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
