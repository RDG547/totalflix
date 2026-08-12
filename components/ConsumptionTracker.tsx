"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { initializeAchievements, updateAchievementProgress } from "@/lib/achievements";

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
        const response = await fetch("/api/activity", {
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
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Registro de consumo indisponível.");

        if (result.firstContentView && type !== "live_tv") {
          await initializeAchievements(user.uid);
          await updateAchievementProgress(
            user.uid,
            type === "movie" ? "movie" : "series",
            String(contentId),
          );
        }
        window.dispatchEvent(new CustomEvent("historyUpdated"));
      } catch (error) {
        console.error("Não foi possível registrar o consumo:", error);
      }
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [user, type, contentId, itemKey, title]);

  return null;
}
