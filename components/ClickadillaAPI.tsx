"use client";

import { useEffect, useState } from "react";

interface Spot {
  id: string | number;
  name: string;
  adFormat: string;
  status: string;
  code: string | null;
  url: string | null;
}

interface ActiveSpots {
  inpage: Spot[];
  webpush: Spot[];
  popunder: Spot[];
  banner: Spot[];
  timestamp: number;
}

export function ClickadillaAPILoader() {
  const [spots, setSpots] = useState<ActiveSpots | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSpots = async () => {
      try {
        const response = await fetch('/api/clickadilla/active-spots');
        
        if (!response.ok) {
          throw new Error(`Failed to load spots: ${response.status}`);
        }

        const data = await response.json();
        setSpots(data);
        
        // Injeta os scripts dos spots carregados
        injectScripts(data);
      } catch (err) {
        console.error('Error loading Clickadilla spots:', err);
        setError('Failed to load ads');
        // Fallback para o método tradicional
        loadFallbackScripts();
      } finally {
        setLoading(false);
      }
    };

    loadSpots();
  }, []);

  const injectScripts = (data: ActiveSpots) => {
    if (typeof window === 'undefined') return;

    // Popunder
    if (data.popunder && data.popunder.length > 0) {
      data.popunder.forEach((spot) => {
        if (spot.code && !document.getElementById(`clickadilla-popunder-${spot.id}`)) {
          const script = document.createElement('script');
          script.id = `clickadilla-popunder-${spot.id}`;
          script.innerHTML = spot.code;
          script.async = true;
          document.body.appendChild(script);
        }
      });
    }

    // Inpage
    if (data.inpage && data.inpage.length > 0) {
      data.inpage.forEach((spot) => {
        if (spot.code && !document.getElementById(`clickadilla-inpage-${spot.id}`)) {
          const script = document.createElement('script');
          script.id = `clickadilla-inpage-${spot.id}`;
          script.innerHTML = spot.code;
          script.async = true;
          document.body.appendChild(script);
        }
      });
    }

    // Webpush
    if (data.webpush && data.webpush.length > 0) {
      data.webpush.forEach((spot) => {
        if (spot.code && !document.getElementById(`clickadilla-webpush-${spot.id}`)) {
          const script = document.createElement('script');
          script.id = `clickadilla-webpush-${spot.id}`;
          script.innerHTML = spot.code;
          script.async = true;
          document.head.appendChild(script);
        }
      });
    }

    // Banner
    if (data.banner && data.banner.length > 0) {
      data.banner.forEach((spot) => {
        if (spot.code) {
          const container = document.getElementById(`clickadilla-banner-${spot.id}`);
          if (container && !container.innerHTML) {
            container.innerHTML = spot.code;
          }
        }
      });
    }
  };

  const loadFallbackScripts = () => {
    // Fallback para o método tradicional se a API falhar
    console.log('Using fallback Clickadilla loader');
    
    // Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register("/clickadilla-sw.js")
        .catch((error) => console.error("Clickadilla SW error:", error));
    }
  };

  // Componente não renderiza nada visualmente, só gerencia scripts
  return null;
}

// Componente para exibir banners específicos
export function ClickadillaBannerAPI({ spotId, className = "" }: { spotId?: string | number; className?: string }) {
  const [bannerHtml, setBannerHtml] = useState<string | null>(null);

  useEffect(() => {
    const loadBanner = async () => {
      try {
        const response = await fetch('/api/clickadilla/active-spots');
        const data: ActiveSpots = await response.json();
        
        let bannerSpot: Spot | undefined;
        
        if (spotId) {
          bannerSpot = data.banner.find((s) => s.id === spotId);
        } else {
          bannerSpot = data.banner[0]; // Primeiro banner disponível
        }

        if (bannerSpot?.code) {
          setBannerHtml(bannerSpot.code);
        }
      } catch (err) {
        console.error('Error loading banner:', err);
      }
    };

    loadBanner();
  }, [spotId]);

  if (!bannerHtml) {
    return <div className={`${className} min-h-[250px]`} />;
  }

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: bannerHtml }}
    />
  );
}

// Hook para verificar status dos anúncios
export function useClickadillaStatus() {
  const [status, setStatus] = useState<{
    loaded: boolean;
    formats: Record<string, number>;
    error: string | null;
  }>({
    loaded: false,
    formats: {},
    error: null,
  });

  useEffect(() => {
    fetch('/api/clickadilla/active-spots')
      .then((res) => res.json())
      .then((data: ActiveSpots) => {
        setStatus({
          loaded: true,
          formats: {
            inpage: data.inpage?.length || 0,
            webpush: data.webpush?.length || 0,
            popunder: data.popunder?.length || 0,
            banner: data.banner?.length || 0,
          },
          error: null,
        });
      })
      .catch((err) => {
        setStatus({
          loaded: false,
          formats: {},
          error: err.message,
        });
      });
  }, []);

  return status;
}
