"use client";

import { useEffect, useState } from "react";
import { Lock, ExternalLink } from "lucide-react";
import {
  buildGateUrl,
  getGateUnlockParam,
  isContentUnlocked,
  isUnlockReferrerValid,
  notifyGateUnlocked,
  savePendingGateContent,
  stripGateUnlockParam,
  unlockContent,
  type GateContentInfo,
} from "@/lib/linkGate";

interface LinkGateProps {
  /** Chave única do conteúdo (filme, episódio ou canal) protegido por este gate. */
  contentKey: string;
  /** Descrição usada na mensagem, ex.: "este filme", "o episódio 2 da temporada 1". */
  label: string;
  children: React.ReactNode;
  /** Dados necessários para reabrir o player após o usuário voltar do encurtador. */
  recoveryInfo?: GateContentInfo;
}

export function LinkGate({ contentKey, label, children, recoveryInfo }: LinkGateProps) {
  const [unlocked, setUnlocked] = useState(() => isContentUnlocked(contentKey));

  useEffect(() => {
    let nextUnlocked = isContentUnlocked(contentKey);

    if (getGateUnlockParam() === contentKey) {
      if (isUnlockReferrerValid()) {
        unlockContent(contentKey);
        notifyGateUnlocked(contentKey);
        nextUnlocked = true;
      }
      stripGateUnlockParam();
    }

    setUnlocked(nextUnlocked);

    // Escuta evento de desbloqueio ou revogação emitido por outra aba ou pelo fechamento do modal
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel("totalflix_gate");
        channel.onmessage = (event) => {
          if (event.data?.type === "GATE_UNLOCKED" && event.data?.key === contentKey) {
            setUnlocked(true);
          } else if (event.data?.type === "GATE_REVOKED" && event.data?.key === contentKey) {
            setUnlocked(false);
          }
        };
      } catch {}
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key?.includes(contentKey)) {
        setUnlocked(isContentUnlocked(contentKey));
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      if (channel) {
        channel.close();
      }
      window.removeEventListener("storage", handleStorage);
    };
  }, [contentKey]);

  if (unlocked) return <>{children}</>;

  const handleUnlockClick = () => {
    if (recoveryInfo) savePendingGateContent(recoveryInfo);
    const returnTo = window.location.pathname + window.location.search;
    const gateUrl = buildGateUrl(contentKey, returnTo);
    window.open(gateUrl, "_blank");
  };

  return (
    <div className="flex h-full min-h-[280px] w-full flex-col items-center justify-center gap-4 bg-black/90 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20">
        <Lock className="h-8 w-8 text-purple-400" />
      </div>
      <h3 className="text-xl font-bold text-white">Conteúdo bloqueado</h3>
      <p className="max-w-md text-sm text-gray-400">
        Para assistir {label} gratuitamente, libere o acesso através do nosso parceiro.
        É rápido e ajuda a manter o site no ar.
      </p>
      <button
        type="button"
        onClick={handleUnlockClick}
        className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-all hover:bg-purple-700 active:scale-95"
      >
        <ExternalLink className="h-4 w-4" />
        Liberar Acesso
      </button>
    </div>
  );
}
