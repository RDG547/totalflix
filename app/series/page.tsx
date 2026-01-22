"use client";

import { useState, useEffect } from "react";
import { tmdb } from "@/lib/tmdb";
import { MovieCard } from "@/components/MovieCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Movie } from "@/lib/tmdb";

export default function SeriesPage() {
  const [series, setSeries] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadSeries(1);
  }, []);

  const loadSeries = async (pageNum: number) => {
    setLoading(true);
    try {
      const results: Movie[] = [];

      // Carregar 3 páginas de uma vez (20 por página = ~60 itens, arredondamos para 50)
      for (let i = 0; i < 3; i++) {
        const actualPage = (pageNum - 1) * 3 + i + 1;
        const data = await tmdb.getPopular("tv", actualPage);

        if (data && Array.isArray(data)) {
          results.push(...data);
        }

        if (!data || data.length < 20) {
          setHasMore(false);
          break;
        }
      }

      // Limitar a 50 itens
      const limitedResults = results.slice(0, 50);

      if (pageNum === 1) {
        setSeries(limitedResults);
      } else {
        setSeries(prev => [...prev, ...limitedResults]);
      }

      setPage(pageNum);

      if (results.length < 50) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Erro ao carregar séries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    loadSeries(page + 1);
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gradient mb-2">📺 Todas as Séries</h1>
          <p className="text-gray-400">Explore nossa coleção completa de séries</p>
        </div>

        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {series.map((show: Movie) => (
              <MovieCard key={`${show.id}-${show.title || show.name}`} movie={show} />
            ))}
          </div>

          {loading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          )}

          {!loading && hasMore && series.length > 0 && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleLoadMore}
                className="glass-effect border border-purple-500/30 hover:border-purple-400/50 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 glow-effect"
              >
                Carregar Mais
              </Button>
            </div>
          )}

          {!loading && !hasMore && series.length > 0 && (
            <p className="text-center text-gray-400 mt-8">
              Você chegou ao fim da lista!
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
