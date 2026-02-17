"use client";

import { useEffect, useState, useRef } from "react";
import { X, Maximize2, Radio, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TVChannel } from "@/lib/tv-channels";
import Hls from "hls.js";

interface TVPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: TVChannel;
}

export function TVPlayerModal({ isOpen, onClose, channel }: TVPlayerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Cleanup HLS instance on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  // Initialize player when channel changes
  useEffect(() => {
    if (!isOpen || !channel.streamUrl) return;

    setIsLoading(true);
    setError(null);

    const video = videoRef.current;
    if (!video) return;

    const streamUrl = channel.streamUrl;

    // Check if it's a YouTube URL
    if (streamUrl.includes("youtube.com") || streamUrl.includes("youtu.be")) {
      // For YouTube, we use iframe
      setIsLoading(false);
      return;
    }

    // For M3U8 streams
    if (streamUrl.includes(".m3u8") || streamUrl.includes("live")) {
      if (Hls.isSupported()) {
        // Destroy previous HLS instance
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new Hls({
          enableWorker: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 10,
        });

        hlsRef.current = hls;

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          console.log("HLS media attached");
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log("HLS manifest parsed");
          setIsLoading(false);
          video.play().catch((e) => {
            console.log("Autoplay prevented:", e);
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS error:", data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError("Erro de rede. Verifique sua conexão.");
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError("Erro no stream do canal.");
                break;
              default:
                setError("Erro ao reproduzir o canal.");
                break;
            }
            setIsLoading(false);
          }
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support (Safari)
        video.src = streamUrl;
        video.addEventListener("loadedmetadata", () => {
          setIsLoading(false);
          video.play().catch((e) => {
            console.log("Autoplay prevented:", e);
          });
        });
        video.addEventListener("error", () => {
          setError("Erro ao carregar o canal.");
          setIsLoading(false);
        });
      } else {
        setError("Seu navegador não suporta reprodução deste canal.");
        setIsLoading(false);
      }
    } else {
      // For other URLs, try as direct video
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        video.play().catch((e) => {
          console.log("Autoplay prevented:", e);
        });
      });
      video.addEventListener("error", () => {
        setError("Erro ao carregar o canal.");
        setIsLoading(false);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = "";
    };
  }, [isOpen, channel.streamUrl]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isOpen]);

  const handleFullscreen = () => {
    const playerContainer = containerRef.current;
    if (playerContainer) {
      if (!document.fullscreenElement) {
        playerContainer.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  if (!isOpen) return null;

  const isYouTube =
    channel.streamUrl.includes("youtube.com") ||
    channel.streamUrl.includes("youtu.be");

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
            <h2 className="text-xl font-bold text-white truncate">
              {channel.name}
            </h2>
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
        <div
          id="tv-player-container"
          ref={containerRef}
          className="relative aspect-video bg-black"
        >
          {isYouTube ? (
            // YouTube iframe player
            <iframe
              src={`${channel.streamUrl}${channel.streamUrl.includes("?") ? "&" : "?"}autoplay=1&mute=1`}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            />
          ) : (
            // HLS Video player
            <>
              <video
                ref={videoRef}
                className="w-full h-full"
                autoPlay
                playsInline
                controls
                muted
                onClick={(e) => {
                  if (e.currentTarget.paused) {
                    e.currentTarget.play();
                  } else {
                    e.currentTarget.pause();
                  }
                }}
              />

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                  <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                  <p className="text-gray-400">Carregando canal...</p>
                </div>
              )}

              {/* Error overlay */}
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90">
                  <div className="text-red-500 text-4xl mb-4">⚠️</div>
                  <p className="text-white text-lg mb-2">{error}</p>
                  <p className="text-gray-400 text-sm mb-4">
                    Este canal pode estar temporariamente indisponível.
                  </p>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="border-purple-500/50 hover:bg-purple-500/20"
                  >
                    Fechar
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
