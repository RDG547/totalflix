"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { initializeAchievements, updateAchievementProgress } from "@/lib/achievements";

export function GenreAchievementTracker({ genreId }: { genreId: number }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !Number.isFinite(genreId)) return;
    void initializeAchievements(user.uid)
      .then(() => updateAchievementProgress(user.uid, "genre", genreId))
      .catch((error) => console.error("Não foi possível registrar o gênero visitado:", error));
  }, [genreId, user]);

  return null;
}
