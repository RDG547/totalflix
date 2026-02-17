"use client";

import { useEffect, useState } from "react";
import { tmdb, type Movie } from "@/lib/tmdb";
import { MovieCard } from "@/components/MovieCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDragScroll } from "@/hooks/useDragScroll";

interface CategorySectionProps {
  category: "movie" | "tv";
  title: string;
  genreId?: number;
}

export function CategorySection({ category, title, genreId }: CategorySectionProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { scrollRef, handleMouseDown, handleMouseLeave, handleMouseUp, handleMouseMove, handleClick } = useDragScroll();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const data = genreId
          ? await tmdb.getByGenre(category, genreId, 1)
          : await tmdb.getPopular(category);

        // Verifica se data tem a propriedade results (novo formato) ou se é array direto (formato antigo)
        const results = data && typeof data === 'object' && 'results' in data ? data.results : data;
        const moviesArray = Array.isArray(results) ? results : [];

        // Buscar detalhes com runtime para cada filme
        const moviesWithRuntime = await Promise.all(
          moviesArray.map(async (movie: Movie) => {
            try {
              const details = await tmdb.getDetails(category, movie.id);
              return { ...movie, runtime: details.runtime };
            } catch (error) {
              return movie;
            }
          })
        );

        setMovies(moviesWithRuntime);
      } catch (error) {
        console.error(`Error fetching ${title}:`, error);
        setMovies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, [category, title, genreId]);

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
        <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
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
        <h2 className="text-2xl font-bold text-white">{title}</h2>
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
        onClick={handleClick}
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-proximity cursor-grab active:cursor-grabbing select-none scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
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
