"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { TVPlayerModal } from "@/components/TVPlayerModal";
import { useAuth } from "@/contexts/AuthContext";
import {
  consumePendingGateContent,
  getGateGrantParam,
  notifyGateUnlocked,
  readGrantKey,
  revokeContentUnlock,
  storeGateGrant,
  stripGateGrantParam,
  type GateContentInfo,
} from "@/lib/linkGate";

// Reabre o player na própria aba quando o encurtador devolve o usuário ao site.
export function GateRecovery() {
  const { user, loading } = useAuth();
  const [recovered, setRecovered] = useState<GateContentInfo | null>(null);
  const handledGrant = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;
    const grant = getGateGrantParam();
    if (!grant || handledGrant.current === grant) return;
    handledGrant.current = grant;

    const key = readGrantKey(grant);
    if (!key) {
      stripGateGrantParam();
      return;
    }

    const recover = async () => {
      try {
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;

        const response = await fetch("/api/access/entitlement", {
          method: "POST",
          headers,
          body: JSON.stringify({ contentKey: key, grant }),
          cache: "no-store",
        });
        const result = await response.json().catch(() => ({})) as { authorized?: boolean };
        if (!response.ok || result.authorized !== true) return;

        storeGateGrant(key, grant);
        notifyGateUnlocked(key);
        const info = consumePendingGateContent(key);
        if (info) {
          setRecovered(info);
        } else {
          // Páginas com player incorporado (sem modal) recebem o grant
          // pelo BroadcastChannel, sem bloquear a única aba com um aviso.
          toast.success("Player liberado!");
        }
      } finally {
        stripGateGrantParam();
      }
    };

    void recover();
  }, [loading, user]);

  if (!recovered) return null;

  const handleCloseRecovered = () => {
    if (recovered) {
      revokeContentUnlock(recovered.key);
    }
    setRecovered(null);
  };

  if (recovered.kind === "tvchannel") {
    return (
      <TVPlayerModal
        isOpen
        onClose={handleCloseRecovered}
        channel={recovered.channel}
      />
    );
  }

  return (
    <VideoPlayerModal
      isOpen
      onClose={handleCloseRecovered}
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
