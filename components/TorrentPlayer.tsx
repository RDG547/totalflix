"use client";

import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { Magnet, Play, Trash2, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TorrentPlayerProps {
    initialMagnet?: string;
    poster?: string;
}

export function TorrentPlayer({ initialMagnet = "", poster }: TorrentPlayerProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerRef = useRef<any>(null);
    const clientRef = useRef<any>(null);
    const [magnetLink, setMagnetLink] = useState(initialMagnet);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadSpeed, setDownloadSpeed] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        // Initialize WebTorrent client only on client side
        const initClient = async () => {
            try {
                const WebTorrent = (await import("webtorrent")).default;
                if (!clientRef.current) {
                    clientRef.current = new WebTorrent();
                }
            } catch (err) {
                console.error("Failed to load WebTorrent:", err);
                setError("Erro ao carregar o cliente Torrent.");
            }
        };

        initClient();

        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
            if (clientRef.current) {
                clientRef.current.destroy();
                clientRef.current = null;
            }
        };
    }, []);

    const startTorrent = () => {
        if (!magnetLink) return;
        if (!clientRef.current) return;

        setIsLoading(true);
        setError(null);
        setIsPlaying(true);

        try {
            // Check if magnet link is valid (basic check)
            if (!magnetLink.startsWith("magnet:") && !magnetLink.endsWith(".torrent")) {
                // If it's a hash, convert to magnet
                if (/^[a-fA-F0-9]{40}$/.test(magnetLink)) {
                    // It's a hash, we'd need to construct the magnet link, but let's assume user provides full link usually
                    // setMagnetLink(`magnet:?xt=urn:btih:${magnetLink}`);
                }
            }

            // If there's an existing torrent, remove it
            if (clientRef.current.torrents.length > 0) {
                clientRef.current.torrents.forEach((t: any) => t.destroy());
            }

            clientRef.current.add(magnetLink, (torrent: any) => {
                // Find the largest file (likely the video)
                const file = torrent.files.find((f: any) => {
                    return f.name.endsWith(".mp4") || f.name.endsWith(".mkv") || f.name.endsWith(".webm");
                }) || torrent.files[0];

                if (!file) {
                    setError("Nenhum arquivo de vídeo encontrado neste torrent.");
                    setIsLoading(false);
                    return;
                }

                // Initialize Video.js if not already done
                if (!playerRef.current && videoRef.current) {
                    playerRef.current = videojs(videoRef.current, {
                        controls: true,
                        responsive: true,
                        fluid: true,
                        poster: poster,
                    });
                }

                // Clean up previous renders
                if (playerRef.current) {
                    playerRef.current.reset();
                }

                // Render file to video element
                file.renderTo(videoRef.current, {
                    autoplay: true,
                }, (err: any, elem: any) => {
                    if (err) {
                        console.error("Render error:", err);
                        setError("Erro ao renderizar o vídeo.");
                    }
                    setIsLoading(false);
                });

                // Monitor progress
                torrent.on('download', (bytes: number) => {
                    setProgress(torrent.progress);
                    setDownloadSpeed(torrent.downloadSpeed);
                });

                torrent.on('done', () => {
                    setProgress(1);
                    setIsLoading(false);
                });


            });

            clientRef.current.on('error', (err: any) => {
                console.error("Torrent client error:", err);
                setError(`Erro no Torrent: ${err.message}`);
                setIsLoading(false);
            });

        } catch (e: any) {
            console.error("Error starting torrent:", e);
            setError(e.message || "Erro desconhecido ao iniciar torrent.");
            setIsLoading(false);
        }
    };

    const stopPlayback = () => {
        if (clientRef.current && clientRef.current.timeRemaining) {
            // Stop logic
        }
        // Re-initialize to clear
        if (playerRef.current) {
            playerRef.current.pause();
        }
        // If we destroy the client, we need to recreate. Easier to just destroy torrents.
        if (clientRef.current) {
            clientRef.current.torrents.forEach((t: any) => t.destroy());
        }
        setIsPlaying(false);
        setProgress(0);
        setDownloadSpeed(0);
    };

    const formatSpeed = (bytes: number) => {
        if (bytes === 0) return "0 B/s";
        const k = 1024;
        const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="w-full h-full flex flex-col bg-black">
            {!isPlaying ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 bg-gray-900 rounded-lg border border-gray-800">
                    <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                        <Magnet className="w-10 h-10 text-purple-500" />
                    </div>

                    <h3 className="text-xl font-bold text-white">WebTorrent Player</h3>
                    <p className="text-gray-400 text-center max-w-md">
                        Cole um Magnet Link abaixo para iniciar o streaming P2P.
                        A qualidade e velocidade dependem da quantidade de peers (seeders).
                    </p>

                    <div className="w-full max-w-xl space-y-4">
                        <input
                            type="text"
                            value={magnetLink}
                            onChange={(e) => setMagnetLink(e.target.value)}
                            placeholder="magnet:?xt=urn:btih:..."
                            className="w-full bg-black/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-all placeholder:text-gray-600"
                        />
                        <Button
                            onClick={startTorrent}
                            disabled={!magnetLink || isLoading}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg glow-effect transition-all"
                        >
                            {isLoading ? "Carregando..." : "Iniciar Streaming"} <Play className="ml-2 w-4 h-4" />
                        </Button>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative w-full h-full flex flex-col">
                    <div data-vjs-player className="flex-1 relative bg-black">
                        <video
                            ref={videoRef}
                            className="video-js vjs-big-play-centered vjs-theme-city"
                            playsInline
                        />
                    </div>

                    {/* Controls / Info Bar */}
                    <div className="bg-gray-900 border-t border-purple-500/20 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold">Velocidade</p>
                                <p className="text-sm text-green-400 font-mono">{formatSpeed(downloadSpeed)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold">Progresso</p>
                                <div className="w-32 h-2 bg-gray-800 rounded-full mt-1 overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500 transition-all duration-300"
                                        style={{ width: `${(progress * 100).toFixed(1)}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold">Peers</p>
                                <p className="text-sm text-blue-400 font-mono">{clientRef.current?.torrents[0]?.numPeers || 0}</p>
                            </div>
                        </div>

                        <Button
                            onClick={stopPlayback}
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                            <StopCircle className="mr-2 w-4 h-4" /> Parar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
