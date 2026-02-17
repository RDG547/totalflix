"use client";

import { useEffect, useState } from "react";
import { tmdb, type Movie } from "@/lib/tmdb";
import { MovieCard } from "@/components/MovieCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDragScroll } from "@/hooks/useDragScroll";

export function TrendingSection() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { 
    scrollRef, 
    handleMouseDown, 
    handleMouseLeave, 
    handleMouseUp, 
    handleMouseMove, 
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleClick 
  } = useDragScroll();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const trending = await tmdb.getTrending("all", "week");

        // Buscar detalhes com runtime para cada filme
        const moviesWithRuntime = await Promise.all(
          trending.map(async (movie: Movie) => {
            try {
              const mediaType = movie.media_type || (movie.title ? "movie" : "tv");
              const details = await tmdb.getDetails(mediaType as 'movie' | 'tv', movie.id);
              return { ...movie, runtime: details.runtime };
            } catch (error) {
              return movie;
            }
          })
        );

        setMovies(moviesWithRuntime);
      } catch (error) {
        console.error("Error fetching trending:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrending();
  }, []);

  const scrollContainer = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth"
      });
    }
  };

  if (isLoading) {
    return (
      <section className="py-8 px-4">
        <h2 className="text-3xl font-bold text-white mb-6">Em Alta</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[2/3] skeleton rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 px-4 container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gradient">🔥 Em Alta</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollContainer("left")}
            className="glass-effect border-purple-500/50"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollContainer("right")}
            className="glass-effect border-purple-500/50"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
        style={{ 
          scrollbarWidth: "none", 
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          scrollBehavior: "auto"
        }}
      >
        {movies.map((movie) => (
          <div key={movie.id} className="flex-none w-48 snap-start">
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </section>
  );
}
