"use client";

import { useEffect, useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdBlockDetector() {
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Detecta AdBlock tentando criar um elemento com classe de anúncio
    const detectAdBlock = async () => {
      try {
        // Método 1: Tenta carregar um arquivo que AdBlocks normalmente bloqueiam
        const adTest = document.createElement('div');
        adTest.className = 'ad ads adsbox doubleclick ad-placement ad-placeholder adbadge BannerAd';
        adTest.style.height = '1px';
        document.body.appendChild(adTest);

        await new Promise(resolve => setTimeout(resolve, 100));

        const isBlocked = adTest.offsetHeight === 0;
        document.body.removeChild(adTest);

        if (isBlocked) {
          setAdBlockDetected(true);
          setShowWarning(true);
        }

        // Método 2: Tenta fazer fetch de um arquivo comum de ads
        try {
          await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
            method: 'HEAD',
            mode: 'no-cors',
          });
        } catch {
          setAdBlockDetected(true);
          setShowWarning(true);
        }
      } catch (error) {
        console.log('AdBlock detection error:', error);
      }
    };

    detectAdBlock();
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative max-w-md w-full bg-gradient-to-br from-red-900/50 to-black border-2 border-red-500/50 rounded-xl p-6 shadow-2xl">
        <button
          onClick={() => setShowWarning(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          <h2 className="text-2xl font-bold text-white">
            AdBlock Detectado
          </h2>

          <p className="text-gray-300 leading-relaxed">
            Detectamos que você está usando um bloqueador de anúncios.
            <br />
            <br />
            Para manter nosso serviço <strong className="text-purple-400">100% gratuito</strong>,
            precisamos de receita de anúncios.
            <br />
            <br />
            Por favor, desative seu AdBlock para este site e recarregue a página.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
            <Button
              onClick={() => window.location.reload()}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Recarregar Página
            </Button>
            <Button
              onClick={() => setShowWarning(false)}
              variant="outline"
              className="flex-1 border-gray-600 hover:bg-gray-800"
            >
              Continuar Mesmo Assim
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            ❤️ Obrigado por apoiar nosso projeto!
          </p>
        </div>
      </div>
    </div>
  );
}
