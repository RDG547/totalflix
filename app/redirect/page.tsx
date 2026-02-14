"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    const returnTo = searchParams.get("returnTo");

    if (!returnTo) {
      router.push("/");
      return;
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanContinue(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams, router]);

  const handleContinue = () => {
    const returnTo = searchParams.get("returnTo");

    if (returnTo === 'player') {
      // Volta para o player com os dados salvos
      const pendingPlayer = sessionStorage.getItem('pendingPlayer');
      if (pendingPlayer) {
        const data = JSON.parse(pendingPlayer);
        sessionStorage.removeItem('pendingPlayer');

        // Volta para a página de detalhes
        router.push(`/details/${data.type}/${data.tmdbId}`);
        return;
      }
    }

    // Fallback
    router.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-900/20 to-black p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Card Principal */}
        <div className="bg-black/80 backdrop-blur-sm border border-purple-500/30 rounded-xl p-8 shadow-2xl">
          <div className="text-center space-y-6">
            <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto" />

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">
                Preparando seu conteúdo...
              </h1>
              <p className="text-gray-400">
                Para manter nosso serviço gratuito, pedimos que você visite nosso parceiro
              </p>
            </div>

            {/* Mensagem */}
            <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-2 border-purple-500/30 rounded-lg p-8 my-6">
              <p className="text-lg text-purple-300 font-semibold mb-2">✨ Obrigado por apoiar nosso projeto!</p>
              <p className="text-sm text-gray-400">Você passou pelo nosso parceiro e agora pode continuar assistindo.</p>
            </div>

            {/* Barra de Progresso */}
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                style={{ width: `${((5 - countdown) / 5) * 100}%` }}
              />
            </div>

            {/* Botão Continuar */}
            <div className="pt-4">
              <Button
                onClick={handleContinue}
                disabled={!canContinue}
                className={`w-full py-6 text-lg font-bold transition-all ${
                  canContinue
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                {canContinue ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Continuar para o Player
                  </>
                ) : (
                  <>Aguarde {countdown} segundos...</>
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              ❤️ Obrigado por apoiar nosso projeto gratuito!
            </p>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-black/60 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 text-center">
            <strong className="text-purple-400">Obrigado!</strong> Você passou pelo nosso parceiro.
            Aguarde alguns segundos e clique no botão para voltar ao conteúdo.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-900/20 to-black">
        <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />
      </div>
    }>
      <RedirectContent />
    </Suspense>
  );
}
