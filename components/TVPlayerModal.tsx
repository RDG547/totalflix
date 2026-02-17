"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { X, Maximize2, Radio, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TVChannel } from "@/lib/tv-channels";
import Hls from "hls.js";
import { usePlayer } from "@/contexts/PlayerContext";

interface TVPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: TVChannel;
}

export function TVPlayerModal({ isOpen, onClose, channel }: TVPlayerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [useNativePlayer, setUseNativePlayer] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const { openPlayer, closePlayer } = usePlayer();

  // Cleanup HLS instance on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  const loadStream = useCallback(async () => {
    if (!isOpen || !channel.streamUrl) return;

    setIsLoading(true);
    setError(null);
    setErrorDetails(null);

    const video = videoRef.current;
    if (!video) return;

    const originalUrl = channel.streamUrl;

    // Check if it's a YouTube URL
    if (originalUrl.includes("youtube.com") || originalUrl.includes("youtu.be")) {
      setUseNativePlayer(false);
      setIsLoading(false);
      return;
    }

    // Para streams M3U8, tenta o proxy
    if (originalUrl.includes(".m3u8")) {
      const proxyUrl = `/api/tv-proxy?url=${encodeURIComponent(originalUrl)}`;
      
      try {
        // Primeiro verifica se o proxy consegue acessar o stream
        const checkResponse = await fetch(proxyUrl);
        if (!checkResponse.ok) {
          const errorData = await checkResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Proxy error: ${checkResponse.status}`);
        }

        const contentType = checkResponse.headers.get('content-type') || '';
        
        // Se não é M3U8, pode ser que o servidor bloqueou
        if (!contentType.includes('mpegurl') && !contentType.includes('m3u8') && !contentType.includes('octet-stream')) {
          // Tenta carregar direto mesmo assim
          console.log('Proxy returned non-M3U8 content, trying direct load');
        }

        if (useNativePlayer || !Hls.isSupported()) {
          // Usa player nativo (Safari)
          video.src = proxyUrl;
          video.addEventListener("loadedmetadata", () => {
            setIsLoading(false);
            video.play().catch((e) => {
              console.log("Autoplay prevented:", e);
            });
          });
          video.addEventListener("error", (e) => {
            console.error("Video error:", e);
            setError("Erro ao carregar o canal.");
            setErrorDetails("O servidor do canal pode estar bloqueando a reprodução.");
            setIsLoading(false);
          });
        } else {
          // Usa HLS.js
          if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
          }

          const hls = new Hls({
            enableWorker: true,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 10,
            debug: false,
            loader: class CustomLoader extends Hls.DefaultConfig.loader {
              load(context: any, config: any, callbacks: any) {
                // Proxy todas as requisições de segmentos
                if (context.url && !context.url.startsWith('/api/')) {
                  context.url = `/api/tv-proxy?url=${encodeURIComponent(context.url)}`;
                }
                super.load(context, config, callbacks);
              }
            },
          });

          hlsRef.current = hls;

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
                  if (data.details === 'manifestLoadError') {
                    setError("Não foi possível carregar o canal.");
                    setErrorDetails("O servidor de streaming pode estar bloqueando acesso externo.");
                  } else {
                    setError("Erro de rede ao carregar o canal.");
                    setErrorDetails(`Detalhes: ${data.details}`);
                  }
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  setError("Erro no stream do canal.");
                  hls.recoverMediaError();
                  return;
                default:
                  setError("Erro ao reproduzir o canal.");
                  setErrorDetails(`Tipo: ${data.type}, Detalhes: ${data.details}`);
                  break;
              }
              setIsLoading(false);
            }
          });

          hls.loadSource(proxyUrl);
          hls.attachMedia(video);
        }
      } catch (err) {
        console.error("Error loading stream:", err);
        setError("Erro ao carregar o canal.");
        setErrorDetails(err instanceof Error ? err.message : "Erro desconhecido");
        setIsLoading(false);
      }
    } else {
      // Para outros tipos de URL, tenta direto
      video.src = originalUrl;
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
  }, [isOpen, channel.streamUrl, useNativePlayer]);

  // Initialize player
  useEffect(() => {
    loadStream();
  }, [loadStream, retryCount]);

  // Notifica contexto quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      openPlayer();
      document.body.style.overflow = "hidden";
    } else {
      closePlayer();
      document.body.style.overflow = "unset";
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      closePlayer();
    };
  }, [isOpen, openPlayer, closePlayer]);

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

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setIsLoading(true);
  };

  const handleTogglePlayer = () => {
    setUseNativePlayer(!useNativePlayer);
    handleRetry();
  };

  if (!isOpen) return null;

  const isYouTube =
    channel.streamUrl.includes("youtube.com") ||
    channel.streamUrl.includes("youtu.be");

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
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
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 px-4">
                  <div className="text-red-500 text-4xl mb-4">⚠️</div>
                  <p className="text-white text-lg mb-2 text-center">{error}</p>
                  {errorDetails && (
                    <p className="text-gray-500 text-sm mb-4 text-center max-w-md">
                      {errorDetails}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleRetry}
                      variant="default"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tentar Novamente
                    </Button>
                    {!useNativePlayer && Hls.isSupported() && (
                      <Button
                        onClick={handleTogglePlayer}
                        variant="outline"
                        className="border-purple-500/50 hover:bg-purple-500/20"
                      >
                        Usar Player Nativo
                      </Button>
                    )}
                    <Button
                      onClick={onClose}
                      variant="outline"
                      className="border-purple-500/50 hover:bg-purple-500/20"
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
