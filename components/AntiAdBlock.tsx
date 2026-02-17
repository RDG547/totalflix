"use client";

import { useEffect, useState } from "react";

export function AntiAdBlock() {
  const [showWarning, setShowWarning] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Delay maior para deixar os scripts de anúncio carregarem
    const timer = setTimeout(() => {
      checkAdBlock();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const checkAdBlock = async () => {
    setIsChecking(true);
    
    // Verificar múltiplas vezes com delay
    let attempts = 0;
    const maxAttempts = 3;
    
    const check = async () => {
      attempts++;
      
      // Método 1: Verificar se elementos de anúncio comuns estão bloqueados
      const testAd = document.createElement("div");
      testAd.className = "adsbox ad-placement ad-banner";
      testAd.style.cssText = "position: absolute; left: -9999px; width: 1px; height: 1px;";
      document.body.appendChild(testAd);

      await new Promise(resolve => setTimeout(resolve, 100));
      
      const isElementBlocked = testAd.offsetHeight === 0 || 
                               testAd.offsetParent === null || 
                               window.getComputedStyle(testAd).display === 'none';
      
      document.body.removeChild(testAd);

      // Método 2: Verificar se scripts de anúncio foram carregados (mais confiável)
      const adScripts = document.querySelectorAll('script[src*="effectivegatecpm.com"]');
      const hasAdScripts = adScripts.length > 0;

      // Método 3: Tentar carregar um script de teste
      let scriptBlocked = false;
      try {
        const testScript = document.createElement('script');
        testScript.type = 'text/javascript';
        testScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        testScript.async = true;
        
        const scriptPromise = new Promise((resolve, reject) => {
          testScript.onload = () => resolve(true);
          testScript.onerror = () => resolve(false);
          setTimeout(() => resolve(false), 2000);
        });
        
        document.head.appendChild(testScript);
        const scriptLoaded = await scriptPromise;
        scriptBlocked = !scriptLoaded;
        
        // Remove o script de teste
        if (testScript.parentNode) {
          testScript.parentNode.removeChild(testScript);
        }
      } catch (e) {
        scriptBlocked = true;
      }

      console.log('AdBlock check:', { 
        attempt: attempts, 
        isElementBlocked, 
        hasAdScripts, 
        scriptBlocked 
      });

      // Só mostra aviso se:
      // 1. Elementos estão bloqueados E
      // 2. Scripts de anúncio não foram carregados E
      // 3. Scripts de teste foram bloqueados
      if (isElementBlocked && !hasAdScripts && scriptBlocked) {
        setShowWarning(true);
        setIsChecking(false);
      } else if (attempts < maxAttempts && (!hasAdScripts || scriptBlocked)) {
        // Tenta novamente após mais tempo
        setTimeout(check, 3000);
      } else {
        setIsChecking(false);
      }
    };

    check();
  };

  const handleClose = () => {
    setShowWarning(false);
  };

  const handleReload = () => {
    window.location.reload();
  };

  if (!showWarning || isChecking) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 p-4">
      <div className="max-w-lg w-full bg-gradient-to-br from-purple-900/80 to-black border border-purple-500/50 rounded-2xl p-8 text-center shadow-2xl shadow-purple-500/20">
        <div className="text-5xl mb-4">🛡️</div>
        <h2 className="text-2xl font-bold text-white mb-4">AdBlock Detectado!</h2>
        <p className="text-gray-300 mb-6 leading-relaxed">
          Detectamos que você está usando um bloqueador de anúncios ou alguma 
          extensão está bloqueando os anúncios.
        </p>
        <p className="text-gray-400 text-sm mb-6">
          O TotalFlix é gratuito graças aos anúncios. Por favor, desative seu 
          AdBlock e recarregue a página para continuar usando o site.
        </p>
        <div className="space-y-3">
          <button
            onClick={handleReload}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            Recarregar Página
          </button>
          <button
            onClick={handleClose}
            className="w-full py-3 px-6 border border-purple-500/50 hover:bg-purple-500/20 text-gray-300 font-semibold rounded-xl transition-all duration-300"
          >
            Continuar Mesmo Assim
          </button>
        </div>
      </div>
    </div>
  );
}
