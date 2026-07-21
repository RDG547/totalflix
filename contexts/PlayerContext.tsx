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

const defaultContext: PlayerContextType = {
  isPlayerOpen: false,
  openPlayer: () => {},
  closePlayer: () => {},
};

export function usePlayer() {
  const context = useContext(PlayerContext);
  return context || defaultContext;
}
