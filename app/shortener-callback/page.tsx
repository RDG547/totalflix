"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

function CallbackContent() {
    const searchParams = useSearchParams();
    const key = searchParams.get("key");
    const [countdown, setCountdown] = useState(8);
    const [canClose, setCanClose] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setCanClose(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleClose = () => {
        if (key) {
            // Marca no localStorage para o tab original detectar
            localStorage.setItem(key, Date.now().toString());

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
                            className={`absolute inset-0 rounded-full transition-all duration-1000 ${canClose
                                    ? "bg-green-500/20 border-2 border-green-500 scale-100"
                                    : "bg-purple-500/20 border-2 border-purple-500 scale-95"
                                }`}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            {canClose ? (
                                <CheckCircle className="w-12 h-12 text-green-500 animate-in zoom-in duration-300" />
                            ) : (
                                <Shield className="w-12 h-12 text-purple-400 animate-pulse" />
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-white">
                            {canClose ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Sparkles className="w-7 h-7 text-yellow-400" />
                                    Conteúdo Liberado!
                                    <Sparkles className="w-7 h-7 text-yellow-400" />
                                </span>
                            ) : (
                                "Verificando acesso..."
                            )}
                        </h1>
                        <p className="text-gray-400">
                            {canClose
                                ? "Obrigado pelo apoio! Você ajuda a manter o TotalFlix gratuito."
                                : "Aguarde enquanto preparamos seu conteúdo."}
                        </p>
                    </div>

                    {/* Progress section */}
                    <div
                        className={`rounded-xl p-5 transition-all duration-500 ${canClose
                                ? "bg-green-900/20 border border-green-500/30"
                                : "bg-purple-900/20 border border-purple-500/30"
                            }`}
                    >
                        <p
                            className={`text-lg font-semibold mb-1 ${canClose ? "text-green-400" : "text-purple-300"
                                }`}
                        >
                            {canClose
                                ? "🎬 Tudo pronto!"
                                : `⏳ Aguarde ${countdown} segundo${countdown !== 1 ? "s" : ""
                                }...`}
                        </p>
                        <p className="text-sm text-gray-500">
                            {canClose
                                ? "Clique abaixo para voltar ao player"
                                : "Preparando o conteúdo para você..."}
                        </p>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-gray-800/80 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-linear ${canClose
                                    ? "bg-gradient-to-r from-green-500 to-emerald-400"
                                    : "bg-gradient-to-r from-purple-600 to-blue-500"
                                }`}
                            style={{ width: `${((8 - countdown) / 8) * 100}%` }}
                        />
                    </div>

                    {/* Button */}
                    <Button
                        onClick={handleClose}
                        disabled={!canClose}
                        className={`w-full py-6 text-lg font-bold rounded-xl transition-all duration-300 ${canClose
                                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02] active:scale-[0.98]"
                                : "bg-gray-700/50 cursor-not-allowed text-gray-500"
                            }`}
                    >
                        {canClose ? (
                            <span className="flex items-center justify-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Voltar ao Player
                            </span>
                        ) : (
                            <span>Aguarde {countdown}s...</span>
                        )}
                    </Button>

                    <p className="text-xs text-gray-600">
                        💡 Após clicar, volte para a aba do player
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
