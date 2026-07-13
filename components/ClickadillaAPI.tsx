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

    const safeInjectScript = (id: string, code: string, target: HTMLElement) => {
      try {
        if (document.getElementById(id)) return;
        const script = document.createElement('script');
        script.id = id;
        script.innerHTML = `try{${code}}catch(e){}`;
        script.async = true;
        target.appendChild(script);
      } catch (e) {
        // Silently ignore ad script injection errors
      }
    };

    // Popunder
    if (data.popunder && data.popunder.length > 0) {
      data.popunder.forEach((spot) => {
        if (spot.code) safeInjectScript(`clickadilla-popunder-${spot.id}`, spot.code, document.body);
      });
    }

    // Inpage
    if (data.inpage && data.inpage.length > 0) {
      data.inpage.forEach((spot) => {
        if (spot.code) safeInjectScript(`clickadilla-inpage-${spot.id}`, spot.code, document.body);
      });
    }

    // Webpush
    if (data.webpush && data.webpush.length > 0) {
      data.webpush.forEach((spot) => {
        if (spot.code) safeInjectScript(`clickadilla-webpush-${spot.id}`, spot.code, document.head);
      });
    }

    // Banner
    if (data.banner && data.banner.length > 0) {
      data.banner.forEach((spot) => {
        if (spot.code) {
          const container = document.getElementById(`clickadilla-banner-${spot.id}`);
          if (container && !container.innerHTML) {
            try { container.innerHTML = spot.code; } catch (e) {}
          }
        }
      });
    }
  };

  const loadFallbackScripts = () => {
    // Fallback para o método tradicional se a API falhar
    console.log('Using fallback Clickadilla loader');

    // Service Worker
    if (
      process.env.NODE_ENV === 'production' &&
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
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
    return null;
  }

  return (
    <div className="w-full flex justify-center bg-black/50">
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: bannerHtml }}
      />
    </div>
  );
}
