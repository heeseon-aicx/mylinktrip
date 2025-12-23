"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface YoutubePlayerContextType {
  isOpen: boolean;
  currentTime: number | null;
  openPlayer: () => void;
  closePlayer: () => void;
  seekTo: (seconds: number) => void;
}

const YoutubePlayerContext = createContext<YoutubePlayerContextType | null>(null);

export function YoutubePlayerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  const openPlayer = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePlayer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const seekTo = useCallback((seconds: number) => {
    setCurrentTime(seconds);
    setIsOpen(true);
  }, []);

  return (
    <YoutubePlayerContext.Provider
      value={{
        isOpen,
        currentTime,
        openPlayer,
        closePlayer,
        seekTo,
      }}
    >
      {children}
    </YoutubePlayerContext.Provider>
  );
}

export function useYoutubePlayer() {
  const context = useContext(YoutubePlayerContext);
  if (!context) {
    throw new Error("useYoutubePlayer must be used within YoutubePlayerProvider");
  }
  return context;
}

// Optional hook - returns null if not within provider (for PlaceCard fallback)
export function useYoutubePlayerOptional() {
  return useContext(YoutubePlayerContext);
}

