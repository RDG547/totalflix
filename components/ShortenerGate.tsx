"use client";

import { useState, useEffect, useCallback } from "react";
import { Lock, ExternalLink, Loader2, Eye, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShortenerGateProps {
    contentKey: string;
    onPassed: () => void;
    title: string;
    posterUrl?: string;
}

export function ShortenerGate({
    contentKey,
    onPassed,
    title,
    posterUrl,
}: ShortenerGateProps) {
    const [shortenedUrl, setShortenedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [clicked, setClicked] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const stableOnPassed = useCallback(onPassed, [onPassed]);

    // Verifica se já passou pelo gate
    useEffect(() => {
        const stored = localStorage.getItem(contentKey);
        if (stored) {
            stableOnPassed();
        }
    }, [contentKey, stableOnPassed]);

    // Gera URL encurtada
    useEffect(() => {
        const generateUrl = async () => {
            try {
                setLoading(true);
                setError(null);

                const callbackUrl = `${window.location.origin}/shortener-callback?key=${encodeURIComponent(contentKey)}`;

                // Alias único
                const ts = Date.now().toString(36).slice(-5);
                const rand = Math.random().toString(36).slice(2, 6);
                const alias = `tf${ts}${rand}`;

                const response = await fetch("/api/shorten", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: callbackUrl, alias }),
                });

                const data = await response.json();

                if (data.shortenedUrl) {
                    setShortenedUrl(data.shortenedUrl);
                } else {
                    // Fallback: use direct callback URL (dev mode ou erro)
                    console.warn("[Gate] Fallback para URL direta:", data.error);
                    setError(data.error);
                    setShortenedUrl(callbackUrl);
                }
            } catch (err) {
                console.error("[Gate] Erro:", err);
                setError("Erro ao conectar com o servidor");
                // Fallback
                const callbackUrl = `${window.location.origin}/shortener-callback?key=${encodeURIComponent(contentKey)}`;
                setShortenedUrl(callbackUrl);
            } finally {
                setLoading(false);
            }
        };

        generateUrl();
    }, [contentKey, retryCount]);

    // Escuta evento de storage (quando callback page seta o localStorage)
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === contentKey && e.newValue) {
                stableOnPassed();
            }
        };

        window.addEventListener("storage", handleStorage);

        // Polling como backup (caso storage event falhe)
        const interval = setInterval(() => {
            const stored = localStorage.getItem(contentKey);
            if (stored) {
                stableOnPassed();
            }
        }, 1500);

        return () => {
            window.removeEventListener("storage", handleStorage);
            clearInterval(interval);
        };
    }, [contentKey, stableOnPassed]);

    const handleClick = () => {
        if (shortenedUrl) {
            window.open(shortenedUrl, "_blank");
            setClicked(true);
        }
    };

    const handleRetry = () => {
        setRetryCount((prev) => prev + 1);
        setClicked(false);
    };

    return (
        <div className="relative w-full h-full min-h-[300px] flex items-center justify-center overflow-hidden">
            {/* Background com poster borrado */}
            {posterUrl && (
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-15 blur-xl scale-110"
                    style={{ backgroundImage: `url(${posterUrl})` }}
                />
            )}

            {/* Overlay escuro */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black/95" />

            {/* Conteúdo */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 py-8 max-w-md mx-auto space-y-5">
                {/* Ícone */}
                <div className="relative">
                    <div
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${clicked
                                ? "bg-yellow-500/20 border-2 border-yellow-500/60 animate-pulse"
                                : "bg-purple-500/20 border-2 border-purple-500/60"
                            }`}
                    >
                        {loading ? (
                            <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                        ) : clicked ? (
                            <Eye className="w-10 h-10 text-yellow-400" />
                        ) : (
                            <Lock className="w-10 h-10 text-purple-400" />
                        )}
                    </div>
                </div>

                {/* Título */}
                <div className="space-y-1.5">
                    <h3 className="text-xl font-bold text-white">
                        {clicked ? "Aguardando verificação..." : "Conteúdo Bloqueado"}
                    </h3>
                    <p className="text-sm text-gray-400 max-w-xs">
                        {clicked
                            ? "Complete a verificação na nova aba e volte aqui. O player será liberado automaticamente."
                            : `Para assistir "${title}", clique no botão abaixo e complete a verificação rápida.`}
                    </p>
                </div>

                {/* Botão principal */}
                {loading ? (
                    <div className="flex items-center gap-2 text-purple-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Preparando link...
                    </div>
                ) : clicked ? (
                    <div className="space-y-3 w-full">
                        {/* Indicador de aguardando */}
                        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 space-y-2">
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                                <span className="text-yellow-300 text-sm font-medium">
                                    Aguardando conclusão...
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">
                                O player será desbloqueado automaticamente após a verificação
                            </p>
                        </div>

                        {/* Botão de abrir novamente */}
                        <button
                            onClick={handleClick}
                            className="text-sm text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
                        >
                            Abrir link novamente
                        </button>
                    </div>
                ) : (
                    <Button
                        onClick={handleClick}
                        disabled={!shortenedUrl}
                        className="w-full max-w-xs py-5 text-base font-bold rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
                    >
                        <ExternalLink className="w-5 h-5 mr-2" />
                        Liberar Conteúdo
                    </Button>
                )}

                {/* Erro (não bloqueia, apenas informa) */}
                {error && !clicked && (
                    <p className="text-xs text-yellow-500/70">
                        ⚠️ {error} — usando link direto
                    </p>
                )}

                {/* Info */}
                <div className="flex items-center gap-2 text-xs text-gray-600">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verificação rápida · Ajuda a manter o TotalFlix gratuito</span>
                </div>

                {/* Retry se necessário */}
                {clicked && (
                    <button
                        onClick={handleRetry}
                        className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                    >
                        Gerar novo link
                    </button>
                )}
            </div>
        </div>
    );
}
