"use client";

import { useEffect, useRef } from "react";

export function GlobalPopunder() {
  const lastPopunderTime = useRef<number>(0);
  const clickCount = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleClick = (e: MouseEvent) => {
      // Ignora clicks em links externos, botões de assistir, ou elementos de vídeo
      const target = e.target as HTMLElement;
      const isWatchButton = 
        target.closest("button")?.textContent?.toLowerCase().includes("assistir") ||
        target.closest("button")?.textContent?.toLowerCase().includes("watch") ||
        target.closest("[data-watch]") !== null;
      
      const isExternalLink = target.closest("a[href^='http']") !== null;
      const isVideoElement = target.closest("video") !== null || target.closest("iframe") !== null;
      
      // Se for botão de assistir, deixa o popunder específico cuidar
      if (isWatchButton) return;
      
      // Se for link externo ou vídeo, não abre popunder
      if (isExternalLink || isVideoElement) return;

      const now = Date.now();
      const timeSinceLastPopunder = now - lastPopunderTime.current;
      const minInterval = 2 * 60 * 1000; // 2 minutos entre popunders
      
      // Incrementa contador de clicks
      clickCount.current += 1;
      
      // Condições para abrir popunder:
      // 1. Já passou 2 minutos desde o último
      // 2. 40% de chance de abrir a cada 3 clicks
      const shouldOpen = 
        timeSinceLastPopunder > minInterval && 
        clickCount.current >= 3 && 
        Math.random() < 0.4;

      if (shouldOpen) {
        lastPopunderTime.current = now;
        clickCount.current = 0;
        
        // Abre o popunder
        try {
          const popunderUrl = "https://fixesconsessionconsession.com/1c/a3/d9/1ca3d9b4f1380b8dd3cbf80b26c73bf9.js";
          
          // Tenta abrir em nova aba
          const popup = window.open("about:blank", "_blank");
          if (popup) {
            popup.location.href = "https://fixesconsessionconsession.com/";
            popup.blur();
            window.focus();
          }
          
          // Recarrega o script do popunder
          const existingScript = document.querySelector('script[src*="fixesconsessionconsession.com/1c/a3/d9"]');
          if (!existingScript) {
            const script = document.createElement("script");
            script.src = popunderUrl;
            script.async = true;
            document.body.appendChild(script);
          }
        } catch (error) {
          console.log("Popunder blocked:", error);
        }
      }
    };

    // Adiciona listener global de click
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}
