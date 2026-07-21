"use client";

import { useEffect, useState } from "react";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { TVPlayerModal } from "@/components/TVPlayerModal";
import {
  consumePendingGateContent,
  getGateUnlockParam,
  isUnlockReferrerValid,
  notifyGateUnlocked,
  stripGateUnlockParam,
  unlockContent,
  type GateContentInfo,
} from "@/lib/linkGate";

// Componente global (montado uma vez no layout) responsável por reabrir o
// player correto ou fechar a aba do encurtador quando o usuário volta do Link Gate.
export function GateRecovery() {
  const [recovered, setRecovered] = useState<GateContentInfo | null>(null);
  const [unlockedSuccess, setUnlockedSuccess] = useState(false);

  useEffect(() => {
    const key = getGateUnlockParam();
    if (!key) return;

    if (isUnlockReferrerValid()) {
      unlockContent(key);
      notifyGateUnlocked(key);
      stripGateUnlockParam();
      setUnlockedSuccess(true);

      // Tenta fechar a aba se ela foi aberta especificamente para o encurtador
      if (typeof window !== "undefined") {
        try {
          window.close();
        } catch {
          // ignora falha de permissão de fechar janela
        }
      }
    }

    const info = consumePendingGateContent(key);
    if (info) {
      setRecovered(info);
    }
  }, []);

  if (unlockedSuccess && !recovered) {
    return (
      <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black/95 p-4 text-center text-white animate-in fade-in duration-200">
        <div className="max-w-md space-y-4 rounded-xl border border-purple-500/30 bg-black/90 p-8 shadow-2xl backdrop-blur-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-400 text-3xl font-bold">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-white">Acesso Liberado!</h2>
          <p className="text-sm text-gray-300">
            Seu conteúdo já foi liberado com sucesso. Você pode fechar esta aba e voltar para a guia do TotalFlix.
          </p>
          <button
            type="button"
            onClick={() => {
              try { window.close(); } catch {}
              window.location.href = "/";
            }}
            className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white transition-all hover:bg-purple-700 active:scale-95 shadow-lg shadow-purple-500/30"
          >
            Fechar Aba
          </button>
        </div>
      </div>
    );
  }

  if (!recovered) return null;

  if (recovered.kind === "tvchannel") {
    return (
      <TVPlayerModal
        isOpen
        onClose={() => setRecovered(null)}
        channel={recovered.channel}
      />
    );
  }

  return (
    <VideoPlayerModal
      isOpen
      onClose={() => setRecovered(null)}
      type={recovered.type}
      tmdbId={recovered.tmdbId}
      title={recovered.title}
      numberOfSeasons={recovered.numberOfSeasons}
      initialSeason={recovered.season}
      initialEpisode={recovered.episode}
      posterPath={recovered.posterPath}
    />
  );
}
