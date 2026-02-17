"use client";

import { useEffect, useState } from "react";

export function AntiAdBlock() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Delay para verificar após a página carregar
    const timer = setTimeout(() => {
      detectAdBlock();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const detectAdBlock = () => {
    // Método 1: Verificar se elementos de anúncio comuns estão bloqueados
    const testAd = document.createElement("div");
    testAd.className = "adsbox";
    testAd.style.position = "absolute";
    testAd.style.left = "-9999px";
    document.body.appendChild(testAd);

    setTimeout(() => {
      const isBlocked = testAd.offsetHeight === 0 || testAd.offsetParent === null;
      document.body.removeChild(testAd);

      if (isBlocked) {
        setShowWarning(true);
      }
    }, 100);

    // Método 2: Verificar se scripts de anúncio foram carregados
    const adScripts = document.querySelectorAll('script[src*="effectivegatecpm.com"]');
    if (adScripts.length === 0) {
      // Verificar novamente após mais tempo
      setTimeout(() => {
        const scripts = document.querySelectorAll('script[src*="effectivegatecpm.com"]');
        if (scripts.length === 0) {
          setShowWarning(true);
        }
      }, 5000);
    }
  };

  const handleClose = () => {
    setShowWarning(false);
    // Reexibir após 5 minutos
    setTimeout(() => {
      detectAdBlock();
    }, 300000);
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 p-4">
      <div className="max-w-lg w-full bg-gradient-to-br from-purple-900/80 to-black border border-purple-500/50 rounded-2xl p-8 text-center shadow-2xl shadow-purple-500/20">
        <div className="text-5xl mb-4">🛡️</div>
        <h2 className="text-2xl font-bold text-white mb-4">AdBlock Detectado!</h2>
        <p className="text-gray-300 mb-6 leading-relaxed">
          Detectamos que você está usando um bloqueador de anúncios. 
          O TotalFlix é gratuito graças aos anúncios. 
          Por favor, desative seu AdBlock para continuar usando o site.
        </p>
        <div className="space-y-3">
          <button
            onClick={handleClose}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            Já desativei o AdBlock
          </button>
          <p className="text-sm text-gray-500">
            Se você não está usando AdBlock, ignore esta mensagem.
          </p>
        </div>
      </div>
    </div>
  );
}
