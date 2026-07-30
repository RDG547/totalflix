"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface ConsumptionTrackerProps {
  type: "movie" | "tv" | "live_tv";
  contentId: string | number;
  itemKey?: string;
  title: string;
}

export function ConsumptionTracker({
  type,
  contentId,
  itemKey,
  title,
}: ConsumptionTrackerProps) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const timer = window.setTimeout(async () => {
      try {
        const idToken = await user.getIdToken();
        await fetch("/api/activity", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type,
            contentId: String(contentId),
            itemKey: itemKey || String(contentId),
            title,
          }),
        });
      } catch (error) {
        console.error("Não foi possível registrar o consumo:", error);
      }
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [user, type, contentId, itemKey, title]);

  return null;
}
