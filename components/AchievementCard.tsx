"use client";

import { Achievement } from "@/lib/achievements";
import { Trophy, Lock } from "lucide-react";

interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const progressPercentage = Math.min(
    (achievement.progress / achievement.requirement) * 100,
    100
  );

  return (
    <div
      className={`glass-effect border rounded-xl p-4 transition-all ${
        achievement.unlocked
          ? "border-yellow-500/50 glow-effect"
          : "border-purple-500/30 opacity-60"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Ícone */}
        <div
          className={`text-4xl ${
            achievement.unlocked ? "animate-bounce" : "grayscale"
          }`}
        >
          {achievement.unlocked ? achievement.icon : <Lock className="w-10 h-10 text-gray-500" />}
        </div>

        {/* Informações */}
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3
                className={`font-bold ${
                  achievement.unlocked ? "text-yellow-400" : "text-gray-400"
                }`}
              >
                {achievement.title}
              </h3>
              <p className="text-sm text-gray-400">{achievement.description}</p>
            </div>
            {achievement.unlocked && (
              <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            )}
          </div>

          {/* Barra de progresso */}
          {!achievement.unlocked && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>
                  {achievement.progress} / {achievement.requirement}
                </span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {achievement.unlocked && achievement.unlockedAt && (
            <p className="text-xs text-gray-500">
              Desbloqueado em{" "}
              {new Date(achievement.unlockedAt).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
