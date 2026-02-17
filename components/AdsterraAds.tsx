"use client";

import Script from "next/script";
import { useEffect } from "react";

// Componente para o banner que precisa do container
function AdsterraBanner() {
  useEffect(() => {
    // Força a execução do script após montagem
    const loadBanner = () => {
      const container = document.getElementById('container-28fe29024925ba318c588b98f9674bb9');
      if (container && typeof window !== 'undefined') {
        // Limpa o container
        container.innerHTML = '';
        
        // Recria o script do banner
        const script = document.createElement('script');
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.src = 'https://pl28735413.effectivegatecpm.com/28fe29024925ba318c588b98f9674bb9/invoke.js';
        
        container.appendChild(script);
      }
    };

    // Delay para garantir que o DOM está pronto
    const timer = setTimeout(loadBanner, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      id="container-28fe29024925ba318c588b98f9674bb9" 
      className="w-full flex justify-center items-center"
      style={{ minHeight: '90px' }}
    />
  );
}

export function AdsterraAds() {
  useEffect(() => {
    // Adiciona meta tags para permitir scripts de anúncio
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = "default-src 'self' *; script-src 'self' 'unsafe-inline' 'unsafe-eval' *; style-src 'self' 'unsafe-inline' *; img-src 'self' data: blob: *; media-src 'self' *; connect-src 'self' *; frame-src 'self' *;";
    
    // Só adiciona se não existir
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <>
      {/* Adsterra Popunder Script - Carrega primeiro */}
      <Script
        src="https://pl28735403.effectivegatecpm.com/1c/a3/d9/1ca3d9b4f1380b8dd3cbf80b26c73bf9.js"
        strategy="afterInteractive"
        onLoad={() => console.log('Adsterra popunder loaded')}
        onError={(e) => console.error('Adsterra popunder error:', e)}
      />
      
      {/* Adsterra Banner Script */}
      <Script
        src="https://pl28735413.effectivegatecpm.com/28fe29024925ba318c588b98f9674bb9/invoke.js"
        strategy="lazyOnload"
        async
        data-cfasync="false"
        onLoad={() => console.log('Adsterra banner loaded')}
        onError={(e) => console.error('Adsterra banner error:', e)}
      />
    </>
  );
}

// Componente para inserir o banner em posições específicas
export function AdsterraBannerInline() {
  return (
    <div className="w-full flex justify-center py-4">
      <AdsterraBanner />
    </div>
  );
}

// Banner nativo/social bar
export function AdsterraNativeAds() {
  useEffect(() => {
    const loadNative = () => {
      const script = document.createElement('script');
      script.async = true;
      script.src = '//threedardschron.com/aa/3c/98/aa3c98746968795e1d9625a5ec72aee4.js';
      document.body.appendChild(script);
    };

    const timer = setTimeout(loadNative, 2000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
