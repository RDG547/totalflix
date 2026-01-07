"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { addToHistory, getUserProfile } from "@/lib/userProfile";
import { updateAchievementProgress, initializeAchievements, Achievement } from "@/lib/achievements";
import { AchievementNotification } from "./AchievementNotification";

interface HistoryTrackerProps {
  contentId: number;
  type: "movie" | "tv";
}

export function HistoryTracker({ contentId, type }: HistoryTrackerProps) {
  const { user } = useAuth();
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (user) {
      // Adicionar ao histórico após 3 segundos (para garantir que o usuário realmente visualizou)
      const timer = setTimeout(async () => {
        try {
          // Verificar se este conteúdo já foi assistido antes
          const profile = await getUserProfile(user.uid);
          const wasWatchedBefore = profile?.history.some(item => item.id === contentId) || false;

          // Adicionar ao histórico
          await addToHistory(user.uid, contentId, type);

          // Só atualizar conquistas se for a primeira vez assistindo este conteúdo
          if (!wasWatchedBefore) {
            // Inicializar conquistas se necessário
            await initializeAchievements(user.uid);

            // Atualizar progresso de conquista
            const newlyUnlocked = await updateAchievementProgress(
              user.uid,
              type === "movie" ? "movie" : "series"
            );

            if (newlyUnlocked.length > 0) {
              setUnlockedAchievements(newlyUnlocked);
            }
          }
        } catch (error) {
          console.error("Erro ao adicionar ao histórico:", error);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [user, contentId, type]);

  return (
    <>
      {unlockedAchievements.map((achievement, index) => (
        <AchievementNotification
          key={achievement.id}
          achievement={achievement}
          onClose={() => {
            setUnlockedAchievements((prev) =>
              prev.filter((a) => a.id !== achievement.id)
            );
          }}
        />
      ))}
    </>
  );
}
