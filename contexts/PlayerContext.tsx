"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface PlayerContextType {
  isPlayerOpen: boolean;
  openPlayer: () => void;
  closePlayer: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const openPlayer = useCallback(() => {
    setIsPlayerOpen(true);
  }, []);

  const closePlayer = useCallback(() => {
    setIsPlayerOpen(false);
  }, []);

  return (
    <PlayerContext.Provider value={{ isPlayerOpen, openPlayer, closePlayer }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
