"use client";

import { useState, useEffect } from "react";
import { Clapperboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tmdb } from "@/lib/tmdb";

interface TrailerButtonProps {
  mediaType: "movie" | "tv";
  id: number;
}

export function TrailerButton({ mediaType, id }: TrailerButtonProps) {
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

      // Procurar trailer oficial em português ou inglês
      const trailer = videos.find((video: any) =>
        video.type === "Trailer" &&
        video.site === "YouTube" &&
        (video.iso_639_1 === "pt" || video.iso_639_1 === "en")
      ) || videos.find((video: any) =>
        video.site === "YouTube" &&
        video.type === "Trailer"
      ) || videos[0];

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

  const closeModal = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      <Button
        onClick={loadTrailer}
        disabled={loading}
        className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white"
        size="lg"
      >
        <Clapperboard className="w-5 h-5 mr-2" />
        {loading ? "Carregando..." : "Ver Trailer"}
      </Button>

      {isOpen && trailerKey && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-[10000]"
            aria-label="Fechar"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div
            className="relative w-full max-w-5xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
              className="w-full h-full rounded-lg shadow-2xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
}
