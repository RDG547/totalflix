"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { tmdb, type Movie } from "@/lib/tmdb";
import { MovieCard } from "@/components/MovieCard";
import { Search } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const searchContent = async () => {
      if (!query) {
        setIsLoading(false);
        return;
      }

      try {
        const searchResults = await tmdb.search(query);
        setResults(searchResults.filter((item: any) => item.poster_path));
      } catch (error) {
        console.error("Error searching:", error);
      } finally {
        setIsLoading(false);
      }
    };

    searchContent();
  }, [query]);

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {query ? `Resultados para "${query}"` : "Buscar"}
          </h1>
          <p className="text-gray-400">
            {isLoading
              ? "Buscando..."
              : results.length > 0
              ? `${results.length} resultados encontrados`
              : query
              ? "Nenhum resultado encontrado"
              : "Digite algo para buscar"}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[2/3] skeleton rounded-lg" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {results.map((item) => (
              <MovieCard key={item.id} movie={item} />
            ))}
          </div>
        ) : query ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Search className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">Nenhum resultado encontrado</p>
            <p className="text-gray-500 text-sm mt-2">Tente buscar com outras palavras</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[2/3] skeleton rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
