"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Gauge, Languages, Loader2, Pause, Play, RotateCcw, RotateCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STREMIO_ADDONS, getStreamsFromAddon, sortStreamsByQuality, groupStreamsByQuality, type StreamSource, type StremioAddonId } from "@/lib/stremio";

interface TorrentPlayerProps {
    tmdbId?: number;
    mediaType?: 'movie' | 'tv';
    season?: number;
    episode?: number;
    poster?: string;
}

interface BrowserAudioTrack {
    enabled: boolean;
    id?: string;
    label?: string;
    language?: string;
}

const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const total = Math.floor(seconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const rest = total % 60;
    return hours > 0
        ? `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`
        : `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
};

export default function TorrentPlayer({ tmdbId, mediaType, season, episode, poster }: TorrentPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const clientRef = useRef<any>(null);
    const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const playbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isClientReady, setIsClientReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadSpeed, setDownloadSpeed] = useState(0);
    const [uploadSpeed, setUploadSpeed] = useState(0);
    const [peers, setPeers] = useState(0);
    const [isPaused, setIsPaused] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audioTracks, setAudioTracks] = useState<BrowserAudioTrack[]>([]);
    const [selectedAudioTrack, setSelectedAudioTrack] = useState(0);
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);

    // Stream detection
    const [streams, setStreams] = useState<StreamSource[]>([]);
    const [isLoadingStreams, setIsLoadingStreams] = useState(false);
    const [selectedAddon, setSelectedAddon] = useState<StremioAddonId | null>(null);
    const [showManualInput, setShowManualInput] = useState(false);
    const [magnetLink, setMagnetLink] = useState("");

    useEffect(() => {
        // Initialize WebTorrent client
        const initClient = async () => {
            try {
                const WebTorrent = (await import("webtorrent")).default;
                if (!clientRef.current) {
                    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
                    await navigator.serviceWorker.ready;

                    const client = new WebTorrent({
                        tracker: {
                            rtcConfig: {
                                iceServers: [
                                    { urls: 'stun:stun.l.google.com:19302' },
                                    { urls: 'stun:global.stun.twilio.com:3478' }
                                ]
                            }
                        }
                    });
                    client.createServer({ controller: registration });
                    client.on('error', (err: Error) => {
                        console.error('WebTorrent client error:', err);
                        setError(`Erro no WebTorrent: ${err.message}`);
                        setIsLoading(false);
                    });
                    clientRef.current = client;
                    setIsClientReady(true);
                    console.log('WebTorrent client initialized');
                }
            } catch (err) {
                console.error("Failed to load WebTorrent:", err);
                setError("Erro ao carregar o cliente Torrent.");
            }
        };

        initClient();

        return () => {
            if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
            if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current);
            if (clientRef.current) {
                clientRef.current._server?.close?.();
                clientRef.current.destroy();
                clientRef.current = null;
            }
        };
    }, []);

    const fetchStreams = useCallback(async (addon: StremioAddonId) => {
        if (!tmdbId || !mediaType) return;

        setIsLoadingStreams(true);
        setError(null);

        try {
            const fetchedStreams = await getStreamsFromAddon(addon, tmdbId, mediaType, season, episode);
            const sortedStreams = sortStreamsByQuality(fetchedStreams);
            setStreams(sortedStreams);

            if (sortedStreams.length === 0) {
                setError("Nenhum stream encontrado.");
                setShowManualInput(true);
            }
        } catch (err: any) {
            console.error("Error fetching streams:", err);
            setError("Erro ao buscar streams.");
            setShowManualInput(true);
        } finally {
            setIsLoadingStreams(false);
        }
    }, [episode, mediaType, season, tmdbId]);

    // Auto-fetch streams when addon is selected
    useEffect(() => {
        if (tmdbId && mediaType && selectedAddon && !isPlaying) {
            void fetchStreams(selectedAddon);
        }
    }, [fetchStreams, isPlaying, mediaType, selectedAddon, tmdbId]);

    const startTorrent = (magnet: string) => {
        if (!magnet) return;
        if (!clientRef.current || !isClientReady) {
            setError("O player ainda está iniciando. Aguarde um instante e tente novamente.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setIsPlaying(true);

        console.log('🚀 Starting torrent...');
        console.log('Magnet:', magnet.substring(0, 100) + '...');

        // Destroy existing torrents
        if (clientRef.current.torrents.length > 0) {
            clientRef.current.torrents.forEach((t: any) => {
                console.log('Destroying existing torrent:', t.name);
                t.destroy();
            });
        }

        if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
        if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current);

        // Limite para receber os metadados do magnet.
        const metadataTimeout = setTimeout(() => {
            setError("O torrent não respondeu. Escolha uma opção com mais seeds ou tente outra fonte.");
            setIsLoading(false);
            setIsPlaying(false);
            if (clientRef.current) {
                try { clientRef.current.remove(magnet); } catch (_) {}
            }
        }, 45000);

        try {
            clientRef.current.add(magnet, {
                announce: [
                    'wss://tracker.openwebtorrent.com',
                    'wss://tracker.webtorrent.dev',
                    'wss://tracker.btorrent.xyz',
                ],
            }, (torrent: any) => {
                clearTimeout(metadataTimeout);
                console.log('✅ Torrent added:', torrent.name);
                console.log('📁 Files:', torrent.files.length);

                // Find video file
                const videoExtensions = ['.mp4', '.webm', '.m4v', '.mov', '.mkv'];
                const videoFile = torrent.files
                    .filter((f: any) => videoExtensions.some(ext => f.name.toLowerCase().endsWith(ext)))
                    .reduce((largest: any, current: any) =>
                        !largest || current.length > largest.length ? current : largest
                        , null) || torrent.files[0];

                if (!videoFile) {
                    setError("Nenhum arquivo de vídeo encontrado.");
                    setIsLoading(false);
                    setIsPlaying(false);
                    return;
                }

                torrent.files.forEach((file: any) => {
                    if (file !== videoFile) file.deselect();
                });
                videoFile.select(10);

                console.log('🎬 Selected file:', videoFile.name);
                console.log('📦 Size:', (videoFile.length / 1024 / 1024).toFixed(2), 'MB');

                // Stream to video element
                if (videoRef.current) {
                    const video = videoRef.current;
                    video.controls = true;
                    video.muted = false;
                    videoFile.streamTo(video);

                    const handlePlaying = () => {
                        if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current);
                        setIsLoading(false);
                        setIsPaused(false);
                    };
                    const handleVideoError = () => {
                        setError("O navegador não conseguiu reproduzir o formato deste arquivo. Prefira uma opção MP4/WebM.");
                        setIsLoading(false);
                        setIsPlaying(false);
                    };
                    video.addEventListener('playing', handlePlaying, { once: true });
                    video.addEventListener('error', handleVideoError, { once: true });
                    void video.play().catch(() => {
                        // Autoplay com som pode ser bloqueado; os controles continuam disponíveis.
                        setIsLoading(false);
                    });

                    playbackTimeoutRef.current = setTimeout(() => {
                        if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
                            setError("Nenhum peer WebRTC enviou dados suficientes. Tente um torrent com mais seeds WebTorrent ou outra fonte.");
                            setIsLoading(false);
                            setIsPlaying(false);
                            try { clientRef.current?.remove(torrent.infoHash); } catch (_) {}
                        }
                    }, 60000);
                } else {
                    // Fail-safe if video ref isn't ready
                    console.error("Video ref missing");
                    setError("Erro interno: Elemento de vídeo não encontrado.");
                    setIsLoading(false);
                    setIsPlaying(false);
                }

                // Update stats every second
                const updateStats = () => {
                    if (torrent.destroyed) return;
                    setProgress(torrent.progress);
                    setDownloadSpeed(torrent.downloadSpeed);
                    setUploadSpeed(torrent.uploadSpeed);
                    setPeers(torrent.numPeers);
                };

                statsIntervalRef.current = setInterval(updateStats, 1000);

                torrent.on('wire', () => {
                    console.log('🔗 Peer connected! Total:', torrent.numPeers);
                });

                torrent.on('download', () => {
                    // Optional: log occasionally
                });

                torrent.on('done', () => {
                    console.log('✅ Download complete!');
                    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
                });

                torrent.on('error', (err: any) => {
                    console.error('❌ Torrent error:', err);
                    setError(err.message);
                    setIsLoading(false);
                    setIsPlaying(false);
                    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
                });
            });

        } catch (e: any) {
            clearTimeout(metadataTimeout);
            console.error("Exception adding torrent:", e);
            setError("Erro ao adicionar torrent: " + e.message);
            setIsLoading(false);
        }
    };

    const stopPlayback = () => {
        if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
        if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current);
        if (clientRef.current && clientRef.current.torrents.length > 0) {
            clientRef.current.torrents.forEach((t: any) => t.destroy());
        }
        setIsPlaying(false);
        setProgress(0);
        setDownloadSpeed(0);
        setUploadSpeed(0);
        setPeers(0);
        setIsLoading(false);
        setCurrentTime(0);
        setDuration(0);
        setAudioTracks([]);
        setIsPaused(true);
    };

    const syncAudioTracks = () => {
        const video = videoRef.current as (HTMLVideoElement & { audioTracks?: ArrayLike<BrowserAudioTrack> }) | null;
        const tracks = video?.audioTracks ? Array.from(video.audioTracks) : [];
        setAudioTracks(tracks);
        const activeIndex = tracks.findIndex((track) => track.enabled);
        setSelectedAudioTrack(activeIndex >= 0 ? activeIndex : 0);
    };

    const togglePlayback = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) void video.play();
        else video.pause();
    };

    const seekBy = (seconds: number) => {
        const video = videoRef.current;
        if (!video) return;
        const upperLimit = Number.isFinite(video.duration) ? video.duration : video.currentTime + Math.max(seconds, 0);
        video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), upperLimit);
    };

    const selectAudioTrack = (index: number) => {
        const video = videoRef.current as (HTMLVideoElement & { audioTracks?: ArrayLike<BrowserAudioTrack> }) | null;
        if (!video?.audioTracks) return;
        Array.from(video.audioTracks).forEach((track, trackIndex) => {
            track.enabled = trackIndex === index;
        });
        setSelectedAudioTrack(index);
    };

    return (
        <div className="relative w-full h-full flex flex-col bg-black">
            {/* Video Player */}
            {isPlaying ? (
                <div className="relative min-h-0 flex-1 flex flex-col">
                    <video
                        ref={videoRef}
                        className="min-h-0 w-full flex-1 bg-black object-contain"
                        playsInline
                        onClick={togglePlayback}
                        onPlay={() => setIsPaused(false)}
                        onPause={() => setIsPaused(true)}
                        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                        onDurationChange={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
                        onLoadedMetadata={(event) => {
                            setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0);
                            syncAudioTracks();
                        }}
                    />

                    <div className="shrink-0 border-t border-white/10 bg-black/95 px-3 py-2 text-white sm:px-4">
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            step="0.1"
                            value={Math.min(currentTime, duration || 0)}
                            disabled={!duration}
                            onChange={(event) => {
                                const nextTime = Number(event.target.value);
                                if (videoRef.current) videoRef.current.currentTime = nextTime;
                                setCurrentTime(nextTime);
                            }}
                            aria-label="Posição do vídeo"
                            className="h-1.5 w-full cursor-pointer accent-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <div className="mt-1.5 flex items-center gap-1 sm:gap-2">
                            <button type="button" onClick={togglePlayback} className="rounded-md p-2 hover:bg-white/10" aria-label={isPaused ? "Reproduzir" : "Pausar"}>
                                {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                            </button>
                            <button type="button" onClick={() => seekBy(-10)} className="rounded-md p-2 hover:bg-white/10" aria-label="Retroceder 10 segundos" title="Retroceder 10s">
                                <RotateCcw className="h-5 w-5" />
                            </button>
                            <button type="button" onClick={() => seekBy(10)} className="rounded-md p-2 hover:bg-white/10" aria-label="Avançar 10 segundos" title="Avançar 10s">
                                <RotateCw className="h-5 w-5" />
                            </button>
                            <span className="ml-1 whitespace-nowrap font-mono text-xs text-gray-300 sm:text-sm">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                            {audioTracks.length > 1 && (
                                <label className="relative ml-auto flex items-center gap-1 rounded-md bg-white/10 px-2 py-1.5 text-xs">
                                    <Languages className="h-4 w-4" />
                                    <span className="hidden sm:inline">Áudio</span>
                                    <select value={selectedAudioTrack} onChange={(event) => selectAudioTrack(Number(event.target.value))} className="max-w-28 appearance-none bg-transparent pr-4 outline-none sm:max-w-40" aria-label="Faixa de áudio">
                                        {audioTracks.map((track, index) => (
                                            <option key={track.id || index} value={index} className="bg-black">
                                                {track.label || track.language || `Faixa ${index + 1}`}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-1 h-3 w-3" />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Stats Overlay */}
                    <div className="absolute right-2 top-2 z-10 overflow-hidden rounded-lg bg-black/80 text-white shadow-lg backdrop-blur-sm sm:right-4 sm:top-4">
                        <button type="button" onClick={() => setIsStatsExpanded((expanded) => !expanded)} className="flex w-full items-center gap-2 px-2.5 py-2 text-xs hover:bg-white/10" aria-expanded={isStatsExpanded}>
                            <Gauge className="h-4 w-4 text-purple-400" />
                            <span>{(downloadSpeed / 1024 / 1024).toFixed(2)} MB/s</span>
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isStatsExpanded ? "rotate-180" : ""}`} />
                        </button>
                        {isStatsExpanded && <div className="space-y-1.5 border-t border-white/10 px-3 py-2 text-xs">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-400">Velocidade</span>
                            <span className="font-mono">{(downloadSpeed / 1024 / 1024).toFixed(2)} MB/s</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-400">Upload</span>
                            <span className="font-mono">{(uploadSpeed / 1024).toFixed(0)} KB/s</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-400">Progresso</span>
                            <span className="font-mono">{(progress * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-400">Peers</span>
                            <span className="font-mono text-green-400">{peers}</span>
                        </div>
                        </div>}
                    </div>

                    {/* Stop Button */}
                    <Button
                        onClick={stopPlayback}
                        variant="destructive"
                        size="sm"
                        className="absolute top-4 left-4 z-10"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Parar
                    </Button>

                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
                            <div className="text-center">
                                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                                <p className="text-white">Conectando aos peers...</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 bg-gray-900 rounded-lg border border-gray-800 overflow-y-auto">
                    <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                        <Play className="w-10 h-10 text-purple-500" />
                    </div>

                    <h3 className="text-xl font-bold text-white">WebTorrent Player</h3>

                    {/* Addon Selection */}
                    {!selectedAddon && tmdbId && !isLoadingStreams ? (
                        <div className="w-full max-w-xl space-y-4">
                            <p className="text-gray-400 text-center">Selecione a fonte de torrents:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {STREMIO_ADDONS.map((addon) => (
                                    <button
                                        key={addon.id}
                                        onClick={() => setSelectedAddon(addon.id)}
                                        className="p-6 bg-gradient-to-br from-purple-600/20 to-purple-900/20 border-2 border-purple-500/50 rounded-lg hover:border-purple-400 hover:from-purple-600/30 hover:to-purple-900/30 transition-all"
                                    >
                                        <div className="text-4xl mb-2">{addon.icon}</div>
                                        <div className="text-white font-bold">{addon.name}</div>
                                        <div className="text-xs text-gray-400 mt-1">{addon.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {/* Streams List */}
                    {isLoadingStreams ? (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                            <p className="text-gray-400">Buscando streams...</p>
                        </div>
                    ) : streams.length > 0 ? (
                        <div className="w-full max-w-2xl space-y-4">
                            <div className="text-center">
                                <p className="text-gray-400 text-sm">
                                    {streams.length} stream{streams.length > 1 ? 's' : ''} encontrado{streams.length > 1 ? 's' : ''}
                                </p>
                                <p className="text-purple-400 text-xs mt-1">
                                    Fonte: {STREMIO_ADDONS.find((addon) => addon.id === selectedAddon)?.icon}{' '}
                                    {STREMIO_ADDONS.find((addon) => addon.id === selectedAddon)?.name}
                                </p>
                                <button
                                    onClick={() => { setSelectedAddon(null); setStreams([]); }}
                                    className="text-xs text-gray-500 hover:text-purple-400 transition-colors mt-2"
                                >
                                    ← Trocar fonte
                                </button>
                            </div>

                            <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                                {Object.entries(groupStreamsByQuality(streams)).map(([quality, qualityStreams]) => (
                                    <div key={quality} className="space-y-2">
                                        <h4 className="text-sm font-bold text-white sticky top-0 bg-gray-900 py-2 px-3 rounded-lg border border-purple-500/30">
                                            {quality === '4K' || quality === '2160P' ? '🎬 4K Ultra HD' :
                                                quality === '1080P' ? '📺 Full HD 1080p' :
                                                    quality === '720P' ? '💿 HD 720p' :
                                                        quality === '480P' ? '📀 SD 480p' :
                                                            `📹 ${quality}`} ({qualityStreams.length})
                                        </h4>
                                        {qualityStreams.map((stream, index) => (
                                            <button
                                                key={index}
                                                onClick={() => stream.magnetLink && startTorrent(stream.magnetLink)}
                                                disabled={!stream.magnetLink || isLoading}
                                                className="w-full p-3 bg-black/50 border border-purple-500/30 rounded-lg hover:bg-purple-500/10 hover:border-purple-500/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                            {stream.isDubbed ? (
                                                                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                                                                    🎙️ DUBLADO
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                                                    📝 LEG
                                                                </span>
                                                            )}
                                                            {stream.size && (
                                                                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                                                                    💾 {stream.size}
                                                                </span>
                                                            )}
                                                            {stream.seeds !== undefined && stream.seeds > 0 && (
                                                                <span className="text-xs text-green-400 bg-gray-800 px-2 py-0.5 rounded-full">
                                                                    👤 {stream.seeds}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-300 truncate group-hover:text-white transition-colors">
                                                            {stream.title}
                                                        </p>
                                                    </div>
                                                    <Play className="w-4 h-4 text-purple-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowManualInput(!showManualInput)}
                                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                {showManualInput ? '← Voltar para lista' : 'Ou cole um magnet link manualmente →'}
                            </button>
                        </div>
                    ) : null}

                    {/* Manual Input */}
                    {showManualInput && (
                        <div className="w-full max-w-xl space-y-4">
                            <input
                                type="text"
                                value={magnetLink}
                                onChange={(e) => setMagnetLink(e.target.value)}
                                placeholder="Cole o magnet link aqui..."
                                className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            />
                            <Button
                                onClick={() => magnetLink && startTorrent(magnetLink)}
                                disabled={!magnetLink || isLoading}
                                className="w-full"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                Reproduzir
                            </Button>
                        </div>
                    )}

                    {error && (
                        <div className="w-full max-w-xl p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
