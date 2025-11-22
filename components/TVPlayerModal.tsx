"use client";

import { useEffect, useState } from "react";
import { X, Maximize2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TVChannel } from "@/lib/tv-channels";

interface TVPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: TVChannel;
}

export function TVPlayerModal({ isOpen, onClose, channel }: TVPlayerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isOpen]);

  const handleFullscreen = () => {
    const playerContainer = document.getElementById("tv-player-container");
    if (playerContainer) {
      if (!document.fullscreenElement) {
        playerContainer.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-6xl bg-black/95 rounded-xl overflow-hidden shadow-2xl border border-purple-500/30 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-500/30 bg-gradient-to-r from-red-900/50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              AO VIVO
            </div>
            <h2 className="text-xl font-bold text-white truncate">{channel.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
              className="hover:bg-purple-500/20 transition-all active:scale-95"
              title="Tela Cheia"
            >
              <Maximize2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-purple-500/20 transition-all active:scale-95"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Channel Info */}
        <div className="flex items-center gap-3 p-3 bg-black/50 border-b border-purple-500/20">
          <Radio className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-gray-400">
            {channel.category} • {channel.country}
          </span>
        </div>

        {/* TV Player Container */}
        <div id="tv-player-container" className="relative aspect-video bg-black">
          <iframe
            key={channel.streamUrl}
            src={channel.streamUrl}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          />
        </div>
      </div>
    </div>
  );
}

