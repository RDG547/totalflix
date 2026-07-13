"use client";

import { useEffect } from "react";

export function Clickadilla() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    // O arquivo precisa continuar na raiz, exatamente como fornecido pelo Clickadilla.
    void navigator.serviceWorker
      .register("/301ByB.js", { scope: "/clickadilla-push/" })
      .catch((error) => console.error("Erro ao registrar Clickadilla SW:", error));
  }, []);

  return null;
}

export function ClickadillaBanner() {
  return (
    <div className="flex min-h-[90px] w-full justify-center bg-black/50">
      <div data-banner-id="1481459" />
    </div>
  );
}
