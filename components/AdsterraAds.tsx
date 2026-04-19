"use client";

import Script from "next/script";
import { useEffect } from "react";

// Componente para o banner nativo que precisa do container
export function AdsterraNativeBanner() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadBanner = () => {
      const container = document.getElementById('container-28fe29024925ba318c588b98f9674bb9');
      if (container) {
        container.innerHTML = '';

        const script = document.createElement('script');
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.src = 'https://fixesconsessionconsession.com/28fe29024925ba318c588b98f9674bb9/invoke.js';

        container.appendChild(script);
      }
    };

    const timer = setTimeout(loadBanner, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      id="container-28fe29024925ba318c588b98f9674bb9"
      className="w-full flex justify-center items-center"
    />
  );
}

// Componente para o banner 300x250
export function AdsterraBanner300x250() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadBanner = () => {
      (window as any).atOptions = {
        'key': '0cd45963b149420881addc1d209ed7a8',
        'format': 'iframe',
        'height': 250,
        'width': 300,
        'params': {}
      };

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
    />
  );
}

// Componente para o Social Bar
export function AdsterraSocialBar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

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

// Componente principal que carrega todos os scripts
export function AdsterraAds() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = "default-src 'self' *; script-src 'self' 'unsafe-inline' 'unsafe-eval' *; style-src 'self' 'unsafe-inline' *; img-src 'self' data: blob: *; media-src 'self' *; connect-src 'self' *; frame-src 'self' *;";

    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <>
      <Script
        src="https://fixesconsessionconsession.com/1c/a3/d9/1ca3d9b4f1380b8dd3cbf80b26c73bf9.js"
        strategy="afterInteractive"
      />

      <Script
        src="https://fixesconsessionconsession.com/28fe29024925ba318c588b98f9674bb9/invoke.js"
        strategy="lazyOnload"
        async
        data-cfasync="false"
      />

      <Script
        src="https://fixesconsessionconsession.com/0cd45963b149420881addc1d209ed7a8/invoke.js"
        strategy="lazyOnload"
        async
      />

      <Script
        src="https://fixesconsessionconsession.com/15/da/a7/15daa72a489fd7df869f93d46c20df79.js"
        strategy="lazyOnload"
        async
      />
    </>
  );
}

// Wrapper para o banner nativo inline
export function AdsterraNativeBannerInline() {
  return (
    <div className="w-full flex justify-center py-4">
      <AdsterraNativeBanner />
    </div>
  );
}

// Wrapper para o banner 300x250 inline
export function AdsterraBanner300x250Inline() {
  return (
    <div className="w-full flex justify-center py-4">
      <AdsterraBanner300x250 />
    </div>
  );
}

// Marcador para o Social Bar
export function AdsterraSocialBarMarker() {
  return <AdsterraSocialBar />;
}
