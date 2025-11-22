"use client";

import { useState, useEffect, useRef } from "react";
import { MovieCard } from "@/components/MovieCard";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Movie } from "@/lib/tmdb";

interface GenrePaginationProps {
  initialMovies: Movie[];
  initialSeries: Movie[];
  genreId: number;
  type: string;
  initialMoviePage: number;
  initialSeriesPage: number;
  totalMoviePages: number;
  totalSeriesPages: number;
}

export function GenrePagination({
  initialMovies,
  initialSeries,
  genreId,
  type,
  initialMoviePage,
  initialSeriesPage,
  totalMoviePages,
  totalSeriesPages,
}: GenrePaginationProps) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [series, setSeries] = useState<Movie[]>(initialSeries);
  const [moviePage, setMoviePage] = useState(initialMoviePage);
  const [seriesPage, setSeriesPage] = useState(initialSeriesPage);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  // Scroll infinito para categoria "both" (Todos)
  useEffect(() => {
    if (type !== "both") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMovies && !loadingSeries) {
          if (moviePage < totalMoviePages) {
            loadMoreMovies();
          } else if (seriesPage < totalSeriesPages) {
            loadMoreSeries();
          }
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [type, moviePage, seriesPage, loadingMovies, loadingSeries]);

  const loadMoreMovies = async () => {
    if (moviePage >= totalMoviePages || loadingMovies) return;

    setLoadingMovies(true);
    try {
      const response = await fetch(
        `/api/genre?type=movie&genreId=${genreId}&page=${moviePage + 1}`
      );
      const data = await response.json();
      setMovies([...movies, ...data.results]);
      setMoviePage(moviePage + 1);
    } catch (error) {
      console.error("Error loading more movies:", error);
    } finally {
      setLoadingMovies(false);
    }
  };

  const loadMoreSeries = async () => {
    if (seriesPage >= totalSeriesPages || loadingSeries) return;

    setLoadingSeries(true);
    try {
      const response = await fetch(
        `/api/genre?type=tv&genreId=${genreId}&page=${seriesPage + 1}`
      );
      const data = await response.json();
      setSeries([...series, ...data.results]);
      setSeriesPage(seriesPage + 1);
    } catch (error) {
      console.error("Error loading more series:", error);
    } finally {
      setLoadingSeries(false);
    }
  };

  const goToPage = async (pageType: 'movie' | 'tv', newPage: number) => {
    if (pageType === 'movie') {
      setLoadingMovies(true);
      try {
        const response = await fetch(
          `/api/genre?type=movie&genreId=${genreId}&page=${newPage}`
        );
        const data = await response.json();
        setMovies(data.results);
        setMoviePage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        console.error("Error loading page:", error);
      } finally {
        setLoadingMovies(false);
      }
    } else {
      setLoadingSeries(true);
      try {
        const response = await fetch(
          `/api/genre?type=tv&genreId=${genreId}&page=${newPage}`
        );
        const data = await response.json();
        setSeries(data.results);
        setSeriesPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        console.error("Error loading page:", error);
      } finally {
        setLoadingSeries(false);
      }
    }
  };

  return (
    <>
      {/* Movies Section */}
      {type !== "tv" && movies.length > 0 && (
        <section className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          {type === "both" ? (
            // Scroll infinito para "Todos"
            <>
              {(loadingMovies || moviePage < totalMoviePages) && (
                <div ref={observerRef} className="flex justify-center py-8">
                  {loadingMovies && <Loader2 className="w-8 h-8 animate-spin text-purple-400" />}
                </div>
              )}
            </>
          ) : (
            // Paginação com botões para filtros específicos
            moviePage < totalMoviePages && (
              <div className="flex justify-center items-center gap-4">
                <Button
                  onClick={() => goToPage('movie', moviePage - 1)}
                  disabled={moviePage === 1 || loadingMovies}
                  variant="outline"
                  className="glass-effect border-purple-500/50"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Anterior
                </Button>

                <span className="text-gray-300 font-medium">
                  Página {moviePage} de {totalMoviePages}
                </span>

                <Button
                  onClick={() => goToPage('movie', moviePage + 1)}
                  disabled={moviePage >= totalMoviePages || loadingMovies}
                  className="glow-effect"
                >
                  {loadingMovies ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      Próxima
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )
          )}
        </section>
      )}

      {/* Series Section */}
      {type !== "movie" && series.length > 0 && (
        <section className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {series.map((show) => (
              <MovieCard key={show.id} movie={show} />
            ))}
          </div>

          {type === "both" ? (
            // Scroll infinito para "Todos"
            <>
              {(loadingSeries || seriesPage < totalSeriesPages) && (
                <div ref={observerRef} className="flex justify-center py-8">
                  {loadingSeries && <Loader2 className="w-8 h-8 animate-spin text-purple-400" />}
                </div>
              )}
            </>
          ) : (
            // Paginação com botões para filtros específicos
            seriesPage < totalSeriesPages && (
              <div className="flex justify-center items-center gap-4">
                <Button
                  onClick={() => goToPage('tv', seriesPage - 1)}
                  disabled={seriesPage === 1 || loadingSeries}
                  variant="outline"
                  className="glass-effect border-purple-500/50"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Anterior
                </Button>

                <span className="text-gray-300 font-medium">
                  Página {seriesPage} de {totalSeriesPages}
                </span>

                <Button
                  onClick={() => goToPage('tv', seriesPage + 1)}
                  disabled={seriesPage >= totalSeriesPages || loadingSeries}
                  className="glow-effect"
                >
                  {loadingSeries ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      Próxima
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )
          )}
        </section>
      )}
    </>
  );
}
