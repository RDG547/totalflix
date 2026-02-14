"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { tmdb, getBackdropUrl, type Movie, type MovieDetails } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
import { Info, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { WatchButton } from "@/components/WatchButton";

interface FeaturedMovie {
  movie: Movie;
  details: MovieDetails | null;
  trailerKey: string | null;
}

// Delay antes de iniciar o trailer
const TRAILER_START_DELAY = 5000;

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  destroy: () => void;
  getDuration: () => number;
  getCurrentTime: () => number;
}

export function Hero() {
  const [featuredMovies, setFeaturedMovies] = useState<FeaturedMovie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isYTAPILoaded, setIsYTAPILoaded] = useState(false);
  
  // Refs
  const playerRef = useRef<YTPlayer | null>(null);
  const trailerStartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Carrega a API do YouTube
  useEffect(() => {
    if (window.YT) {
      setIsYTAPILoaded(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsYTAPILoaded(true);
    };

    return () => {
      window.onYouTubeIframeAPIReady = undefined;
    };
  }, []);

  const fetchFeaturedMovies = useCallback(async () => {
    try {
      const trending = await tmdb.getTrending("movie", "day");
      if (trending && trending.length > 0) {
        const top3 = trending.slice(0, 3);
        
        const moviesWithDetails = await Promise.all(
          top3.map(async (movie: Movie) => {
            const details = await tmdb.getDetails("movie", movie.id);
            
            const videos = details.videos?.results || [];
            const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') ||
              videos.find(v => v.site === 'YouTube');
            
            return {
              movie,
              details,
              trailerKey: trailer?.key || null,
            };
          })
        );
        
        setFeaturedMovies(moviesWithDetails);
      }
    } catch (error) {
      console.error("Error fetching featured movies:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedMovies();
  }, [fetchFeaturedMovies]);

  // Destrói o player anterior
  const destroyPlayer = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    if (trailerStartTimerRef.current) {
      clearTimeout(trailerStartTimerRef.current);
      trailerStartTimerRef.current = null;
    }
  }, []);

  // Avança para o próximo filme
  const goToNext = useCallback(() => {
    destroyPlayer();
    setShowTrailer(false);
    setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
  }, [featuredMovies.length, destroyPlayer]);

  // Inicializa o player do YouTube
  const initPlayer = useCallback((videoId: string) => {
    if (!window.YT || !containerRef.current) return;

    // Limpa o container
    containerRef.current.innerHTML = '';
    
    // Cria o div para o player
    const playerDiv = document.createElement('div');
    playerDiv.id = 'youtube-player-' + videoId;
    containerRef.current.appendChild(playerDiv);

    playerRef.current = new window.YT.Player(playerDiv.id, {
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        showinfo: 0,
        rel: 0,
        loop: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        disablekb: 1,
        fs: 0,
        playsinline: 1,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
      },
      events: {
        onReady: (event) => {
          event.target.playVideo();
        },
        onStateChange: (event) => {
          // Quando o vídeo termina (ENDED = 0)
          if (event.data === window.YT.PlayerState.ENDED) {
            // Avança para o próximo filme
            goToNext();
          }
        },
      },
    });
  }, [goToNext]);

  // Gerencia o trailer
  useEffect(() => {
    destroyPlayer();
    
    const currentFeatured = featuredMovies[currentIndex];
    if (!currentFeatured?.trailerKey || isLoading || !isYTAPILoaded) {
      setShowTrailer(false);
      return;
    }

    // Reset trailer visibility
    setShowTrailer(false);

    // Timer para iniciar o trailer após 5 segundos
    trailerStartTimerRef.current = setTimeout(() => {
      setShowTrailer(true);
      initPlayer(currentFeatured.trailerKey!);
    }, TRAILER_START_DELAY);

    return () => {
      destroyPlayer();
    };
  }, [currentIndex, featuredMovies, isLoading, isYTAPILoaded, initPlayer, destroyPlayer]);

  const goToPrevious = () => {
    destroyPlayer();
    setShowTrailer(false);
    setCurrentIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
  };

  const goToIndex = (index: number) => {
    if (index !== currentIndex) {
      destroyPlayer();
      setShowTrailer(false);
      setCurrentIndex(index);
    }
  };

  if (isLoading || featuredMovies.length === 0) {
    return (
      <div className="relative h-[80vh] w-full skeleton" />
    );
  }

  const currentFeatured = featuredMovies[currentIndex];
  const currentMovie = currentFeatured.movie;
  const currentDetails = currentFeatured.details;
  const title = currentMovie.title || currentMovie.name || "";
  const mediaType = currentMovie.media_type || "movie";

  return (
    <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] w-full overflow-hidden mt-16 group isolate">
      {/* Background Images */}
      {featuredMovies.map((featured, index) => (
        <div
          key={featured.movie.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Background Image */}
          <div
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              index === currentIndex && showTrailer ? 'opacity-0' : 'opacity-100'
            }`}
            style={{
              backgroundImage: `url(${getBackdropUrl(featured.movie.backdrop_path)})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          {/* Video Background Container */}
          {index === currentIndex && featured.trailerKey && (
            <div 
              className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden transition-opacity duration-1000 ${
                showTrailer ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ backgroundColor: '#000' }}
            >
              {/* Container do YouTube Player */}
              <div 
                ref={containerRef}
                className="absolute inset-0 flex items-center justify-center"
                style={{ 
                  width: 'calc(100% + 40px)', 
                  height: 'calc(100% + 40px)',
                  margin: '-20px',
                }}
              />
              {/* Overlays gradientes */}
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
            </div>
          )}
        </div>
      ))}

      {/* Navigation Arrows */}
      {featuredMovies.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Filme anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Próximo filme"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div className="max-w-2xl space-y-3 sm:space-y-4 md:space-y-6 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white drop-shadow-2xl line-clamp-2">
            {title}
          </h1>

          <div className="flex items-center space-x-4 text-sm sm:text-base">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-400 text-base sm:text-lg">★</span>
              <span className="text-white font-semibold">
                {currentMovie.vote_average?.toFixed(1)}
              </span>
            </div>
            <span className="text-gray-300">
              {currentMovie.release_date?.split("-")[0] || currentMovie.first_air_date?.split("-")[0]}
            </span>
          </div>

          <p className="text-gray-200 text-sm sm:text-base md:text-lg line-clamp-2 sm:line-clamp-3 max-w-xl">
            {currentMovie.overview}
          </p>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <WatchButton
              type={mediaType as "movie" | "tv"}
              tmdbId={currentMovie.id}
              title={title}
              numberOfSeasons={currentDetails?.number_of_seasons}
            />
            <Link href={`/details/${mediaType}/${currentMovie.id}`}>
              <Button size="lg" variant="outline" className="glass-effect border-purple-500/50 w-full sm:w-auto">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Mais Informações
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Dots Indicator */}
      {featuredMovies.length > 1 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[5] flex space-x-2">
          {featuredMovies.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-8' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Ir para filme ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </div>
  );
}
