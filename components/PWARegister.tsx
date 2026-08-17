"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWARegister() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [scrollTopVisible, setScrollTopVisible] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);

  useEffect(() => {
    let serviceWorkerUpdateTimer: number | undefined;
    let isRefreshingForUpdate = false;
    let isEffectActive = true;
    let handleServiceWorkerControllerChange: (() => void) | undefined;

    // Service workers e o cache do Next não devem interferir no HMR local.
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "development") {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => void registration.unregister());
        });

        if ("caches" in window) {
          caches.keys().then((cacheNames) => {
            cacheNames.forEach((cacheName) => void caches.delete(cacheName));
          });
        }
      } else {
        const hadController = Boolean(navigator.serviceWorker.controller);
        handleServiceWorkerControllerChange = () => {
          if (!hadController || isRefreshingForUpdate) return;
          isRefreshingForUpdate = true;
          window.location.reload();
        };

        navigator.serviceWorker.addEventListener("controllerchange", handleServiceWorkerControllerChange);
        navigator.serviceWorker
          .register("/sw.js", { updateViaCache: "none" })
          .then((registration) => {
            if (!isEffectActive) return;
            console.log("Service Worker registrado:", registration);
            void registration.update();
            serviceWorkerUpdateTimer = window.setInterval(() => {
              void registration.update();
            }, 60 * 60 * 1000);
          })
          .catch((error) => {
            console.error("Erro ao registrar Service Worker:", error);
          });
      }
    }

    // Captura o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installPrompt = e as BeforeInstallPromptEvent;
      deferredPromptRef.current = installPrompt;
      setDeferredPrompt(installPrompt);
      setShowFloatingButton(true);
      window.dispatchEvent(new CustomEvent("pwa-install-available", { detail: true }));
    };

    // Verifica se o app já está instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      deferredPromptRef.current = null;
      setShowFloatingButton(false);
      window.dispatchEvent(new CustomEvent("pwa-install-available", { detail: false }));
    };

    // Listen for ScrollToTop visibility changes
    const handleScrollTopVisibility = (e: Event) => {
      setScrollTopVisible((e as CustomEvent).detail.visible);
    };

    // Verifica se está rodando em standalone (instalado)
    if (typeof window !== "undefined") {
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;
      setIsInstalled(isStandalone);

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.addEventListener("appinstalled", handleAppInstalled);
      window.addEventListener("scrolltop-visibility", handleScrollTopVisibility);

      const handleInstallRequest = async () => {
        const installPrompt = deferredPromptRef.current;
        if (!installPrompt) return;
        await installPrompt.prompt();
        await installPrompt.userChoice;
        deferredPromptRef.current = null;
        setDeferredPrompt(null);
        setShowFloatingButton(false);
        window.dispatchEvent(new CustomEvent("pwa-install-available", { detail: false }));
      };
      window.addEventListener("pwa-install-request", handleInstallRequest);

      return () => {
        isEffectActive = false;
        if (serviceWorkerUpdateTimer) window.clearInterval(serviceWorkerUpdateTimer);
        if (handleServiceWorkerControllerChange) {
          navigator.serviceWorker.removeEventListener("controllerchange", handleServiceWorkerControllerChange);
        }
        window.removeEventListener(
          "beforeinstallprompt",
          handleBeforeInstallPrompt
        );
        window.removeEventListener("appinstalled", handleAppInstalled);
        window.removeEventListener("scrolltop-visibility", handleScrollTopVisibility);
        window.removeEventListener("pwa-install-request", handleInstallRequest);
      };
    }
  }, []);

  useEffect(() => {
    if (!showFloatingButton) return;
    const timer = window.setTimeout(() => setShowFloatingButton(false), 8000);
    return () => window.clearTimeout(timer);
  }, [showFloatingButton]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("Usuário aceitou instalar o app");
    } else {
      console.log("Usuário recusou instalar o app");
    }

    setDeferredPrompt(null);
    deferredPromptRef.current = null;
    setShowFloatingButton(false);
    window.dispatchEvent(new CustomEvent("pwa-install-available", { detail: false }));
  };

  // Só mostra o botão se puder instalar e não estiver instalado
  if (!deferredPrompt || isInstalled || !showFloatingButton) return null;

  return (
    <div
      className="fixed right-4 sm:right-8 z-50 animate-in slide-in-from-right transition-all duration-300"
      style={{ bottom: scrollTopVisible ? '7rem' : '2rem' }}
    >
      <button
        onClick={handleInstall}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full shadow-lg shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
      >
        <Download className="w-5 h-5" />
        Instalar App
      </button>
    </div>
  );
}
