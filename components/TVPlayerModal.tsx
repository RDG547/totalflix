"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Loader2, Maximize2, Radio, RefreshCw, X } from "lucide-react";
import Hls from "hls.js";
import { Button } from "@/components/ui/button";
import type { TVChannel } from "@/lib/tv-channels";
import { usePlayer } from "@/contexts/PlayerContext";
import { LinkGate } from "@/components/LinkGate";
import { buildChannelGateKey, revokeContentUnlock, type GateContentInfo } from "@/lib/linkGate";
import { ConsumptionTracker } from "@/components/ConsumptionTracker";
import { useScrollLock } from "@/hooks/useScrollLock";

interface TVPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: TVChannel;
}

const LOAD_TIMEOUT_MS = 20_000;
const IFRAME_OVERLAY_TIMEOUT_MS = 4_000;

const isYouTubeUrl = (url: string) => /(?:youtube\.com|youtu\.be)/i.test(url);
const isHlsUrl = (url: string) => /(?:\.m3u8?|format=m3u8|type=hls)(?:$|[?#&])/i.test(url);
const isDirectVideoUrl = (url: string) => /\.(?:mp4|webm|ogv|ogg|mov)(?:$|[?#])/i.test(url);
const isDirectMediaUrl = (url: string) => isHlsUrl(url) || isDirectVideoUrl(url);
const buildProxyUrl = (url: string) => `/api/tv-proxy?url=${encodeURIComponent(url)}`;

export function TVPlayerModal({ isOpen, onClose, channel }: TVPlayerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const onCloseRef = useRef(onClose);
  const { openPlayer, closePlayer } = usePlayer();

  const sources = useMemo(() => {
    const rawSources = channel.sources?.length
      ? channel.sources
      : [{ id: channel.id, provider: "Fonte principal", streamUrl: channel.streamUrl }];
    const seen = new Set<string>();

    return rawSources.filter((source) => {
      if (!source.streamUrl || seen.has(source.streamUrl)) return false;
      seen.add(source.streamUrl);
      return true;
    });
  }, [channel.id, channel.sources, channel.streamUrl]);

  const selectedSource = sources[selectedSourceIndex] || sources[0];
  const currentStreamUrl = selectedSource?.streamUrl || "";
  const useIframe = Boolean(currentStreamUrl) && !isDirectMediaUrl(currentStreamUrl);
  const gateKey = buildChannelGateKey(channel.id);
  const gateRecoveryInfo: GateContentInfo = { kind: "tvchannel", key: gateKey, channel };

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handleModalClose = useCallback(() => {
    revokeContentUnlock(gateKey);
    onCloseRef.current();
  }, [gateKey]);

  const clearPlayer = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
  }, []);

  const selectSource = useCallback((index: number) => {
    clearPlayer();
    setSelectedSourceIndex(index);
    setRetryCount(0);
    setError(null);
    setErrorDetails(null);
    setIsLoading(true);
  }, [clearPlayer]);

  const handleRetry = useCallback(() => {
    clearPlayer();
    setError(null);
    setErrorDetails(null);
    setIsLoading(true);
    setRetryCount((count) => count + 1);
  }, [clearPlayer]);

  const handleNextSource = useCallback(() => {
    if (sources.length <= 1) {
      handleRetry();
      return;
    }
    selectSource((selectedSourceIndex + 1) % sources.length);
  }, [handleRetry, selectSource, selectedSourceIndex, sources.length]);

  useEffect(() => {
    setSelectedSourceIndex(0);
    setRetryCount(0);
    setError(null);
    setErrorDetails(null);
    setIsLoading(true);
    clearPlayer();
  }, [channel.id, clearPlayer]);

  useEffect(() => {
    if (!isOpen) return;

    openPlayer();
    const previouslyFocused = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      clearPlayer();
      closePlayer();
      previouslyFocused?.focus?.();
    };
  }, [clearPlayer, closePlayer, isOpen, openPlayer]);

  useEffect(() => {
    if (!isOpen || !rootRef.current) return;

    const modalRoot = rootRef.current;
    const siblings = Array.from(document.body.children).filter((element) => element !== modalRoot);
    const previousState = siblings.map((element) => ({
      inert: (element as HTMLElement).inert,
      ariaHidden: element.getAttribute("aria-hidden"),
    }));

    siblings.forEach((element) => {
      (element as HTMLElement).inert = true;
      element.setAttribute("aria-hidden", "true");
    });

    return () => {
      siblings.forEach((element, index) => {
        (element as HTMLElement).inert = previousState[index].inert;
        const ariaHidden = previousState[index].ariaHidden;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      });
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleModalClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleModalClose, isOpen]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isOpen || !currentStreamUrl) return;

    setError(null);
    setErrorDetails(null);
    setIsLoading(true);

    if (useIframe) {
      // Players de terceiros podem manter requisições abertas e nunca emitir o
      // evento load do iframe, mesmo quando o vídeo já está visível. O overlay
      // inicial é apenas um feedback curto; depois disso, o próprio player
      // externo passa a mostrar o estado real da transmissão.
      const timeout = window.setTimeout(() => {
        setIsLoading(false);
      }, IFRAME_OVERLAY_TIMEOUT_MS);

      return () => window.clearTimeout(timeout);
    }

    const video = videoRef.current;
    if (!video) return;

    let networkRecoveryCount = 0;
    let mediaRecoveryCount = 0;
    const proxiedUrl = buildProxyUrl(currentStreamUrl);
    const timeout = window.setTimeout(() => {
      setError("O canal demorou demais para responder.");
      setErrorDetails("Tente novamente ou selecione outra fonte.");
      setIsLoading(false);
    }, LOAD_TIMEOUT_MS);

    const handleReady = () => {
      window.clearTimeout(timeout);
      setIsLoading(false);
      setError(null);
      setErrorDetails(null);
      void video.play().catch(() => {
        // Autoplay pode ser bloqueado; os controles permanecem disponíveis.
      });
    };

    const handleVideoError = () => {
      window.clearTimeout(timeout);
      setError("Erro ao carregar o canal.");
      setErrorDetails("O servidor não entregou um formato de vídeo compatível.");
      setIsLoading(false);
    };

    video.addEventListener("loadedmetadata", handleReady);
    video.addEventListener("canplay", handleReady);
    video.addEventListener("playing", handleReady);
    video.addEventListener("error", handleVideoError);

    if (isHlsUrl(currentStreamUrl) && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
      });
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, handleReady);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && networkRecoveryCount < 2) {
          networkRecoveryCount += 1;
          hls.startLoad();
          return;
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRecoveryCount < 1) {
          mediaRecoveryCount += 1;
          hls.recoverMediaError();
          return;
        }

        window.clearTimeout(timeout);
        setError("Não foi possível reproduzir o canal.");
        setErrorDetails(`Falha HLS: ${data.details}`);
        setIsLoading(false);
        hls.destroy();
        if (hlsRef.current === hls) hlsRef.current = null;
      });

      hls.attachMedia(video);
      hls.loadSource(proxiedUrl);
    } else {
      video.src = proxiedUrl;
      video.load();
    }

    return () => {
      window.clearTimeout(timeout);
      video.removeEventListener("loadedmetadata", handleReady);
      video.removeEventListener("canplay", handleReady);
      video.removeEventListener("playing", handleReady);
      video.removeEventListener("error", handleVideoError);
      clearPlayer();
    };
  }, [clearPlayer, currentStreamUrl, isOpen, retryCount, useIframe]);

  const handleFullscreen = () => {
    const playerContainer = containerRef.current;
    if (!playerContainer) return;

    if (!document.fullscreenElement) {
      void playerContainer.requestFullscreen().catch((error) => {
        console.error("Não foi possível ativar a tela cheia:", error);
      });
    } else {
      void document.exitFullscreen().catch((error) => {
        console.error("Não foi possível sair da tela cheia:", error);
      });
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      ref={rootRef}
      className="pointer-events-auto fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Fechar player de TV"
        className="absolute inset-0 h-full w-full cursor-default bg-black/90 backdrop-blur-sm"
        onClick={handleModalClose}
      />

      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Canal ${channel.name}`}
        className="relative flex h-[calc(100dvh-1rem)] max-h-[900px] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-purple-500/30 bg-black/95 shadow-2xl sm:h-auto sm:max-h-[calc(100dvh-2rem)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-purple-500/30 bg-gradient-to-r from-red-900/50 to-transparent p-3 sm:p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              AO VIVO
            </div>
            <h2 className="truncate text-base font-bold text-white sm:text-xl">{channel.name}</h2>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
              className="transition-all hover:bg-purple-500/20 active:scale-95"
              title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              <Maximize2 className="h-5 w-5" />
            </Button>
            <Button
              ref={closeButtonRef}
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleModalClose}
              className="transition-all hover:bg-purple-500/20 active:scale-95"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-b border-purple-500/20 bg-black/50 p-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <Radio className="h-4 w-4 shrink-0 text-purple-400" />
            <span className="truncate text-sm text-gray-400">
              {channel.category} • {channel.country}
            </span>
          </div>

          {sources.length > 0 && (
            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:ml-auto sm:justify-end">
              <span className="text-xs text-gray-500">Fonte:</span>
              {sources.map((source, index) => (
                <button
                  key={`${source.id}-${index}`}
                  type="button"
                  onClick={() => selectSource(index)}
                  title={source.provider}
                  className={`max-w-full truncate rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                    index === selectedSourceIndex
                      ? "border-purple-400 bg-purple-600 text-white"
                      : "border-purple-500/30 text-gray-300 hover:bg-purple-500/20"
                  }`}
                >
                  {source.provider}
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          id="tv-player-container"
          ref={containerRef}
          className="relative min-h-0 flex-1 bg-black sm:aspect-video sm:flex-none"
        >
          <LinkGate contentKey={gateKey} label={`o canal ${channel.name}`} recoveryInfo={gateRecoveryInfo}>
            <ConsumptionTracker
              type="live_tv"
              contentId={channel.id}
              itemKey={channel.id}
              title={channel.name}
            />

            {currentStreamUrl ? (
              useIframe ? (
                <iframe
                  key={`${currentStreamUrl}-${retryCount}`}
                  src={isYouTubeUrl(currentStreamUrl)
                    ? `${currentStreamUrl}${currentStreamUrl.includes("?") ? "&" : "?"}autoplay=1&mute=1`
                    : currentStreamUrl}
                  title={`Transmissão de ${channel.name}`}
                  className="h-full min-h-[280px] w-full border-0 sm:min-h-0"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="origin-when-cross-origin"
                  onLoad={() => {
                    setIsLoading(false);
                    setError(null);
                    setErrorDetails(null);
                  }}
                  onError={() => {
                    setIsLoading(false);
                    setError("A fonte externa não pôde ser carregada.");
                    setErrorDetails("Selecione outra fonte ou tente novamente.");
                  }}
                />
              ) : (
                <video
                  key={`${currentStreamUrl}-${retryCount}`}
                  ref={videoRef}
                  className="h-full min-h-[280px] w-full bg-black object-contain sm:min-h-0"
                  autoPlay
                  playsInline
                  controls
                  muted
                />
              )
            ) : (
              <div className="flex h-full min-h-[280px] items-center justify-center text-gray-400">
                Nenhuma fonte disponível para este canal.
              </div>
            )}

            {isLoading && currentStreamUrl && !error && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-purple-500" />
                <p className="text-gray-400">Carregando canal...</p>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 px-4 text-center">
                <div className="mb-3 text-4xl">⚠️</div>
                <p className="mb-2 text-lg text-white">{error}</p>
                {errorDetails && <p className="mb-4 max-w-md text-sm text-gray-500">{errorDetails}</p>}

                <div className="flex flex-wrap justify-center gap-2">
                  <Button type="button" onClick={handleRetry} className="bg-purple-600 hover:bg-purple-700">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Tentar novamente
                  </Button>
                  {sources.length > 1 && (
                    <Button type="button" variant="outline" onClick={handleNextSource} className="border-purple-500/50 hover:bg-purple-500/20">
                      Próxima fonte
                    </Button>
                  )}
                  {currentStreamUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.open(currentStreamUrl, "_blank", "noopener,noreferrer")}
                      className="border-purple-500/50 hover:bg-purple-500/20"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir fonte
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={handleModalClose} className="border-purple-500/50 hover:bg-purple-500/20">
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </LinkGate>
        </div>
      </div>
    </div>,
    document.body,
  );
}
