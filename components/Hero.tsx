"use client";

import { useEffect, useState } from "react";
import { tmdb, getBackdropUrl, type Movie, type MovieDetails } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import Link from "next/link";
import { WatchButton } from "@/components/WatchButton";

export function Hero() {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHeroMovie = async () => {
      try {
        const trending = await tmdb.getTrending("movie", "day");
        if (trending && trending.length > 0) {
          setMovie(trending[0]);
          const details = await tmdb.getDetails("movie", trending[0].id);
          setMovieDetails(details);
        }
      } catch (error) {
        console.error("Error fetching hero movie:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeroMovie();
  }, []);

  if (isLoading || !movie) {
    return (
      <div className="relative h-[80vh] w-full skeleton" />
    );
  }

  const title = movie.title || movie.name || "";
  const mediaType = movie.media_type || "movie";

  return (
    <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] w-full overflow-hidden mt-16">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${getBackdropUrl(movie.backdrop_path)})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

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
                {movie.vote_average?.toFixed(1)}
              </span>
            </div>
            <span className="text-gray-300">
              {movie.release_date?.split("-")[0] || movie.first_air_date?.split("-")[0]}
            </span>
          </div>

          <p className="text-gray-200 text-sm sm:text-base md:text-lg line-clamp-2 sm:line-clamp-3 max-w-xl">
            {movie.overview}
          </p>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <WatchButton
              type={mediaType as "movie" | "tv"}
              tmdbId={movie.id}
              title={title}
              numberOfSeasons={movieDetails?.number_of_seasons}
            />
            <Link href={`/details/${mediaType}/${movie.id}`}>
              <Button size="lg" variant="outline" className="glass-effect border-purple-500/50 w-full sm:w-auto">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Mais Informações
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-32 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
}
