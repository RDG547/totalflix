"use client";

import { useState, useEffect, useCallback } from "react";
import { tmdb, type Movie } from "@/lib/tmdb";
import { MovieCard } from "@/components/MovieCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface MovieWithDetails extends Movie {
  runtime?: number;
}

export default function MoviesPage() {
  const [movies, setMovies] = useState<MovieWithDetails[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadMovies(1);
  }, []);

  const loadMovies = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const results: MovieWithDetails[] = [];

      // Carregar 3 páginas de uma vez (20 por página = ~60 itens, arredondamos para 50)
      for (let i = 0; i < 3; i++) {
        const actualPage = (pageNum - 1) * 3 + i + 1;
        const data = await tmdb.getPopular("movie", actualPage);

        if (data && Array.isArray(data)) {
          // Buscar detalhes para cada filme (incluindo runtime)
          const moviesWithDetails = await Promise.all(
            data.map(async (movie: Movie) => {
              try {
                const details = await tmdb.getDetails("movie", movie.id);
                return {
                  ...movie,
                  runtime: details.runtime,
                };
              } catch (error) {
                // Se falhar, retorna o filme sem runtime
                return movie;
              }
            })
          );
          results.push(...moviesWithDetails);
        }

        if (!data || data.length < 20) {
          setHasMore(false);
          break;
        }
      }

      // Limitar a 50 itens
      const limitedResults = results.slice(0, 50);

      if (pageNum === 1) {
        setMovies(limitedResults);
      } else {
        setMovies(prev => [...prev, ...limitedResults]);
      }

      setPage(pageNum);

      if (results.length < 50) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Erro ao carregar filmes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLoadMore = () => {
    loadMovies(page + 1);
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gradient mb-2">🎬 Todos os Filmes</h1>
          <p className="text-gray-400">Explore nossa coleção completa de filmes</p>
        </div>

        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {movies.map((movie: MovieWithDetails) => (
              <MovieCard key={`${movie.id}-${movie.title}`} movie={movie} />
            ))}
          </div>

          {loading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          )}

          {!loading && hasMore && movies.length > 0 && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleLoadMore}
                className="glass-effect border border-purple-500/30 hover:border-purple-400/50 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 glow-effect"
              >
                Carregar Mais
              </Button>
            </div>
          )}

          {!loading && !hasMore && movies.length > 0 && (
            <p className="text-center text-gray-400 mt-8">
              Você chegou ao fim da lista!
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
