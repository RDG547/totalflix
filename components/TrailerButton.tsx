"use client";

import { useState } from "react";
import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tmdb } from "@/lib/tmdb";
import { TrailerModal } from "@/components/TrailerModal";

interface TrailerButtonProps {
  mediaType: "movie" | "tv";
  id: number;
  title?: string;
  className?: string;
}

export function TrailerButton({ mediaType, id, title = "este conteúdo", className = "" }: TrailerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTrailer = async () => {
    if (trailerKey) {
      setIsOpen(true);
      return;
    }

    setLoading(true);
    try {
      const videos = await tmdb.getVideos(mediaType, id);
      const trailer = videos.find((video: any) =>
        video.type === "Trailer" &&
        video.site === "YouTube" &&
        (video.iso_639_1 === "pt" || video.iso_639_1 === "en")
      ) || videos.find((video: any) =>
        video.site === "YouTube" && video.type === "Trailer"
      ) || videos.find((video: any) => video.site === "YouTube");

      if (trailer?.key) {
        setTrailerKey(trailer.key);
        setIsOpen(true);
      } else {
        alert("Trailer não disponível para este conteúdo.");
      }
    } catch (error) {
      console.error("Erro ao carregar trailer:", error);
      alert("Não foi possível carregar o trailer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={loadTrailer}
        disabled={loading}
        className={`border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 ${className}`}
        size="lg"
      >
        <Clapperboard className="mr-2 h-5 w-5" />
        {loading ? "Carregando..." : "Ver Trailer"}
      </Button>

      <TrailerModal
        isOpen={isOpen}
        trailerKey={trailerKey}
        title={title}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
