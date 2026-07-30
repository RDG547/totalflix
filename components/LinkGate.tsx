"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  buildGateUrl,
  getGateGrantParam,
  getStoredGateGrant,
  notifyGateUnlocked,
  readGrantKey,
  savePendingGateContent,
  storeGateGrant,
  stripGateGrantParam,
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
  const { user, loading: authLoading } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  const verifyAccess = useCallback(async (grant?: string | null) => {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (user) {
        headers.Authorization = `Bearer ${await user.getIdToken()}`;
      }

      const response = await fetch("/api/access/entitlement", {
        method: "POST",
        headers,
        body: JSON.stringify({ contentKey, grant: grant || undefined }),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({})) as {
        authorized?: boolean;
        reason?: string;
      };

      if (result.authorized && grant && result.reason === "gate") {
        storeGateGrant(contentKey, grant);
        notifyGateUnlocked(contentKey);
      }
      setUnlocked(result.authorized === true);
      return result.authorized === true;
    } catch {
      setUnlocked(false);
      return false;
    } finally {
      setChecking(false);
    }
  }, [contentKey, user]);

  useEffect(() => {
    if (authLoading) return;

    setChecking(true);
    const grantFromUrl = getGateGrantParam();
    const matchingUrlGrant = grantFromUrl && readGrantKey(grantFromUrl) === contentKey
      ? grantFromUrl
      : null;
    void verifyAccess(matchingUrlGrant || getStoredGateGrant(contentKey));
    if (grantFromUrl) stripGateGrantParam();

    // Eventos apenas disparam uma nova validação no servidor; nunca autorizam por si.
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel("totalflix_gate");
        channel.onmessage = (event) => {
          if (event.data?.type === "GATE_GRANT_UPDATED" && event.data?.key === contentKey) {
            void verifyAccess(getStoredGateGrant(contentKey));
          } else if (event.data?.type === "GATE_REVOKED" && event.data?.key === contentKey) {
            setUnlocked(false);
          }
        };
      } catch {}
    }

    return () => {
      if (channel) {
        channel.close();
      }
    };
  }, [authLoading, contentKey, verifyAccess]);

  if (checking) {
    return (
      <div className="flex h-full min-h-[280px] w-full flex-col items-center justify-center gap-3 bg-black/90 p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        <p className="text-sm text-gray-400">Verificando seu acesso seguro…</p>
      </div>
    );
  }

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
