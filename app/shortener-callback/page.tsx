"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Shield, Sparkles, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function CallbackContent() {
    const searchParams = useSearchParams();
    const key = searchParams.get("key");
    const [countdown, setCountdown] = useState(15);
    const [canClose, setCanClose] = useState(false);
    const [hasClickedAds, setHasClickedAds] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Detecta quando o usuário volta para esta aba (após clicar em anúncios)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible" && countdown <= 10) {
                // Usuário voltou para a aba após possivelmente clicar nos anúncios
                setHasClickedAds(true);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [countdown]);

    const handleClose = () => {
        if (key) {
            // Marca no localStorage para o tab original detectar (com timestamp)
            const data = {
                passed: true,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(data));

            // Tenta fechar a aba
            window.close();

            // Fallback se não conseguir fechar
            setTimeout(() => {
                alert(
                    "✓ Conteúdo liberado! Você pode fechar esta aba e voltar ao player."
                );
            }, 500);
        }
    };

    const handleConfirmClick = () => {
        setHasClickedAds(true);
        setCanClose(true);
    };

    if (!key) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <p className="text-red-400 text-lg">Link inválido.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-950/30 to-black p-4">
            {/* Background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative max-w-lg w-full space-y-6 z-10">
                <div className="bg-black/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 shadow-2xl shadow-purple-500/10 text-center space-y-6">
                    {/* Icon */}
                    <div className="relative mx-auto w-24 h-24">
                        <div
                            className={`absolute inset-0 rounded-full transition-all duration-1000 ${canClose || hasClickedAds
                                    ? "bg-green-500/20 border-2 border-green-500 scale-100"
                                    : "bg-purple-500/20 border-2 border-purple-500 scale-95"
                                }`}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            {canClose || hasClickedAds ? (
                                <CheckCircle className="w-12 h-12 text-green-500 animate-in zoom-in duration-300" />
                            ) : (
                                <Shield className="w-12 h-12 text-purple-400 animate-pulse" />
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-white">
                            {canClose || hasClickedAds ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Sparkles className="w-7 h-7 text-yellow-400" />
                                    Conteúdo Liberado!
                                    <Sparkles className="w-7 h-7 text-yellow-400" />
                                </span>
                            ) : (
                                "Verificação de Acesso"
                            )}
                        </h1>
                        <p className="text-gray-400">
                            {canClose || hasClickedAds
                                ? "Obrigado pelo apoio! Você ajuda a manter o TotalFlix gratuito."
                                : "Complete os passos abaixo para liberar o conteúdo."}
                        </p>
                    </div>

                    {/* Instructions */}
                    {!canClose && !hasClickedAds && (
                        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2 text-yellow-400">
                                <AlertCircle className="w-5 h-5" />
                                <span className="font-semibold">Instruções importantes:</span>
                            </div>
                            <ol className="text-sm text-gray-300 text-left space-y-2 list-decimal list-inside">
                                <li>Aguarde a página carregar completamente</li>
                                <li>Clique no botão <strong>&quot;Continuar&quot;</strong> ou <strong>&quot;Obter Link&quot;</strong></li>
                                <li>Interaja com os anúncios que aparecerem</li>
                                <li>Aguarde o temporizador abaixo</li>
                                <li>Clique em &quot;Já cliquei nos anúncios&quot;</li>
                            </ol>
                        </div>
                    )}

                    {/* Progress section */}
                    <div
                        className={`rounded-xl p-5 transition-all duration-500 ${canClose || hasClickedAds
                                ? "bg-green-900/20 border border-green-500/30"
                                : "bg-purple-900/20 border border-purple-500/30"
                            }`}
                    >
                        <p
                            className={`text-lg font-semibold mb-1 ${canClose || hasClickedAds ? "text-green-400" : "text-purple-300"
                                }`}
                        >
                            {canClose || hasClickedAds
                                ? "🎬 Tudo pronto!"
                                : countdown > 0
                                    ? `⏳ Aguarde ${countdown} segundo${countdown !== 1 ? "s" : ""}...`
                                    : "✓ Tempo mínimo atingido"}
                        </p>
                        <p className="text-sm text-gray-500">
                            {canClose || hasClickedAds
                                ? "Clique abaixo para voltar ao player"
                                : countdown > 0
                                    ? "Você precisa aguardar e interagir com os anúncios"
                                    : "Agora confirme que clicou nos anúncios"}
                        </p>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-gray-800/80 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-linear ${canClose || hasClickedAds
                                    ? "bg-gradient-to-r from-green-500 to-emerald-400 w-full"
                                    : "bg-gradient-to-r from-purple-600 to-blue-500"
                                }`}
                            style={{ width: canClose || hasClickedAds ? "100%" : `${((15 - countdown) / 15) * 100}%` }}
                        />
                    </div>

                    {/* Buttons */}
                    <div className="space-y-3">
                        {!canClose && !hasClickedAds && countdown <= 5 && (
                            <Button
                                onClick={handleConfirmClick}
                                className="w-full py-6 text-lg font-bold rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Já cliquei nos anúncios - Liberar conteúdo
                                </span>
                            </Button>
                        )}

                        <Button
                            onClick={handleClose}
                            disabled={!canClose && !hasClickedAds}
                            className={`w-full py-6 text-lg font-bold rounded-xl transition-all duration-300 ${canClose || hasClickedAds
                                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02] active:scale-[0.98]"
                                    : "bg-gray-700/50 cursor-not-allowed text-gray-500"
                                }`}
                        >
                            {canClose || hasClickedAds ? (
                                <span className="flex items-center justify-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Voltar ao Player
                                </span>
                            ) : countdown > 0 ? (
                                <span>Aguarde {countdown}s...</span>
                            ) : (
                                <span>Confirme acima para liberar</span>
                            )}
                        </Button>
                    </div>

                    <p className="text-xs text-gray-600">
                        💡 Após clicar em &quot;Voltar ao Player&quot;, volte para a aba do player
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function ShortenerCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-black">
                    <div className="text-purple-400 text-lg animate-pulse">
                        Carregando...
                    </div>
                </div>
            }
        >
            <CallbackContent />
        </Suspense>
    );
}
