"use client";

import Script from "next/script";
import { useEffect } from "react";

// Componente para o banner nativo que precisa do container
function AdsterraNativeBanner() {
  useEffect(() => {
    // Força a execução do script após montagem
    const loadBanner = () => {
      const container = document.getElementById('container-28fe29024925ba318c588b98f9674bb9');
      if (container && typeof window !== 'undefined') {
        // Limpa o container
        container.innerHTML = '';
        
        // Recria o script do banner nativo
        const script = document.createElement('script');
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.src = 'https://fixesconsessionconsession.com/28fe29024925ba318c588b98f9674bb9/invoke.js';
        
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
      style={{ minHeight: '250px' }}
    />
  );
}

// Componente para o banner 300x250
function AdsterraBanner300x250() {
  useEffect(() => {
    const loadBanner = () => {
      // Define as opções do banner
      (window as any).atOptions = {
        'key': '0cd45963b149420881addc1d209ed7a8',
        'format': 'iframe',
        'height': 250,
        'width': 300,
        'params': {}
      };

      // Cria o iframe para o banner
      const container = document.getElementById('banner-300x250-container');
      if (container) {
        const script = document.createElement('script');
        script.src = 'https://fixesconsessionconsession.com/0cd45963b149420881addc1d209ed7a8/invoke.js';
        script.async = true;
        container.appendChild(script);
      }
    };

    const timer = setTimeout(loadBanner, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      id="banner-300x250-container" 
      className="flex justify-center items-center"
      style={{ width: '300px', height: '250px' }}
    />
  );
}

// Componente para o Social Bar
function AdsterraSocialBar() {
  useEffect(() => {
    const loadSocialBar = () => {
      const script = document.createElement('script');
      script.src = 'https://fixesconsessionconsession.com/15/da/a7/15daa72a489fd7df869f93d46c20df79.js';
      script.async = true;
      document.body.appendChild(script);
    };

    const timer = setTimeout(loadSocialBar, 2000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}

// Componente para o Smartlink (redirecionamento)
export function openSmartlink() {
  if (typeof window !== 'undefined') {
    const smartlinkUrl = 'https://fixesconsessionconsession.com/ueqjseci?key=63c9cbec9e24dda8c816a9461f648386';
    window.open(smartlinkUrl, '_blank');
  }
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
      {/* Adsterra Popunder Script */}
      <Script
        src="https://fixesconsessionconsession.com/1c/a3/d9/1ca3d9b4f1380b8dd3cbf80b26c73bf9.js"
        strategy="afterInteractive"
        onLoad={() => console.log('Adsterra popunder loaded')}
        onError={(e) => console.error('Adsterra popunder error:', e)}
      />
      
      {/* Adsterra Native Banner Script */}
      <Script
        src="https://fixesconsessionconsession.com/28fe29024925ba318c588b98f9674bb9/invoke.js"
        strategy="lazyOnload"
        async
        data-cfasync="false"
        onLoad={() => console.log('Adsterra native banner loaded')}
        onError={(e) => console.error('Adsterra native banner error:', e)}
      />

      {/* Adsterra Banner 300x250 Script */}
      <Script
        src="https://fixesconsessionconsession.com/0cd45963b149420881addc1d209ed7a8/invoke.js"
        strategy="lazyOnload"
        async
        onLoad={() => console.log('Adsterra 300x250 banner loaded')}
        onError={(e) => console.error('Adsterra 300x250 banner error:', e)}
      />
      
      {/* Adsterra Social Bar */}
      <Script
        src="https://fixesconsessionconsession.com/15/da/a7/15daa72a489fd7df869f93d46c20df79.js"
        strategy="lazyOnload"
        async
        onLoad={() => console.log('Adsterra social bar loaded')}
        onError={(e) => console.error('Adsterra social bar error:', e)}
      />
    </>
  );
}

// Componente para inserir o banner nativo em posições específicas
export function AdsterraNativeBannerInline() {
  return (
    <div className="w-full flex justify-center py-4">
      <AdsterraNativeBanner />
    </div>
  );
}

// Componente para inserir o banner 300x250
export function AdsterraBanner300x250Inline() {
  return (
    <div className="w-full flex justify-center py-4">
      <AdsterraBanner300x250 />
    </div>
  );
}

// Componente para o Social Bar (já carregado globalmente, mas pode ser usado como marcador)
export function AdsterraSocialBarMarker() {
  return <AdsterraSocialBar />;
}
