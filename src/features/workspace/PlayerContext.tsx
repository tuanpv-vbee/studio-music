'use client';

import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import type { Song } from '@/types/workspace';

interface PlayerCtx {
  /** The song currently loaded in the bottom player (null = no playback). */
  current: Song | null;
  /** True when this song's id matches the current player slot. */
  isCurrent: (id: string) => boolean;
  /** Click handler from a song row — switches to that song, or unloads if it was already current. */
  toggle: (song: Song) => void;
  /** Force-stop and unload the player. */
  stop: () => void;
}

const Ctx = createContext<PlayerCtx | null>(null);

/**
 * Single-track player state. Only ONE song can be "current" at a time — picking
 * a different song from the workspace automatically swaps the player to it,
 * implicitly stopping the previous one.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Song | null>(null);

  const toggle = useCallback((song: Song) => {
    setCurrent((c) => (c?.id === song.id ? null : song));
  }, []);
  const stop = useCallback(() => setCurrent(null), []);
  const isCurrent = useCallback((id: string) => current?.id === id, [current]);

  return (
    <Ctx.Provider value={{ current, isCurrent, toggle, stop }}>{children}</Ctx.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePlayer must be used inside <PlayerProvider>');
  return ctx;
}
