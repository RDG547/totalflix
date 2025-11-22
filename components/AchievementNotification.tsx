"use client";

import { Achievement } from "@/lib/achievements";
import { Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

export function AchievementNotification({
  achievement,
  onClose,
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animação de entrada
    setTimeout(() => setIsVisible(true), 100);

    // Auto fechar após 5 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-20 right-4 z-[9999] transition-all duration-300 ${
        isVisible
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      }`}
    >
      <div className="glass-effect border-2 border-yellow-500/50 rounded-xl p-4 max-w-sm glow-effect animate-pulse">
        <div className="flex items-start gap-4">
          {/* Ícone */}
          <div className="text-5xl animate-bounce">{achievement.icon}</div>

          {/* Conteúdo */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h3 className="font-bold text-yellow-400">
                Conquista Desbloqueada!
              </h3>
            </div>
            <p className="font-semibold text-white">{achievement.title}</p>
            <p className="text-sm text-gray-300">{achievement.description}</p>
          </div>

          {/* Botão fechar */}
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="flex-shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
