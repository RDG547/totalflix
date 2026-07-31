"use client";

import { ShieldAlert } from "lucide-react";

interface TorrentPlayerProps {
  tmdbId?: number;
  mediaType?: "movie" | "tv";
  season?: number;
  episode?: number;
  poster?: string;
}

export default function TorrentPlayer({ poster }: TorrentPlayerProps) {
  return (
    <div
      className="relative flex h-full min-h-[320px] w-full items-center justify-center overflow-hidden bg-black px-6 text-center"
      style={poster ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,.88), rgba(0,0,0,.96)), url(${poster})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      } : undefined}
    >
      <div className="max-w-lg rounded-2xl border border-amber-500/30 bg-black/80 p-6 shadow-2xl backdrop-blur-sm">
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-amber-400" />
        <h3 className="mb-2 text-xl font-bold text-white">Player P2P indisponível</h3>
        <p className="text-sm leading-relaxed text-gray-300">
          O cliente WebTorrent foi desativado por segurança após a identificação de vulnerabilidades sem correção na cadeia de dependências. Selecione outro player acima para continuar assistindo.
        </p>
      </div>
    </div>
  );
}
