"use client";

import { useEffect, useState } from "react";
import { tmdb, getMegaEmbedUrl, type MovieDetails } from "@/lib/tmdb";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: {
    type: string;
    id: string;
  };
}

export default function WatchPage({ params }: PageProps) {
  const { type, id } = params;
  const router = useRouter();
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await tmdb.getDetails(type as "movie" | "tv", parseInt(id));
        setDetails(data);
      } catch (error) {
        console.error("Error fetching details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [type, id]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-white text-xl">Conteúdo não encontrado</div>
      </div>
    );
  }

  const title = details.title || details.name || "";
  const embedUrl = getMegaEmbedUrl(
    type as "movie" | "tv",
    parseInt(id),
    type === "tv" ? selectedSeason : undefined,
    type === "tv" ? selectedEpisode : undefined
  );

  return (
    <div className="min-h-screen pt-16 bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6 glass-effect border-purple-500/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-6">
          {title}
          {type === "tv" && ` - T${selectedSeason}:E${selectedEpisode}`}
        </h1>

        {/* Player */}
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl glow-effect mb-8">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={title}
          />
        </div>

        {/* Episode Selector for TV Shows */}
        {type === "tv" && details.number_of_seasons && (
          <div className="glass-effect rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Selecionar Episódio</h2>

              {/* Season Selector */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Temporada</label>
                <select
                  value={selectedSeason}
                  onChange={(e) => {
                    setSelectedSeason(parseInt(e.target.value));
                    setSelectedEpisode(1);
                  }}
                  className="w-full md:w-64 bg-black/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  {Array.from({ length: details.number_of_seasons || 1 }, (_, i) => i + 1).map(
                    (season) => (
                      <option key={season} value={season}>
                        Temporada {season}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Episode Selector */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Episódio</label>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((episode) => (
                    <button
                      key={episode}
                      onClick={() => setSelectedEpisode(episode)}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        selectedEpisode === episode
                          ? "bg-purple-600 text-white glow-effect"
                          : "bg-black/50 text-gray-300 border border-purple-500/30 hover:border-purple-500 hover:bg-purple-900/20"
                      }`}
                    >
                      {episode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overview */}
        <div className="mt-8 glass-effect rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Sobre</h2>
          <p className="text-gray-300 leading-relaxed">
            {details.overview || "Sem descrição disponível."}
          </p>
        </div>
      </div>
    </div>
  );
}
