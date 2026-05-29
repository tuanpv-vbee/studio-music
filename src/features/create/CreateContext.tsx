'use client';

import { createContext, ReactNode, useContext } from 'react';
import { useGenerate } from '@/hooks/useGenerate';

/**
 * Shares the create-flow state (form fields + generation lifecycle) produced by
 * `useGenerate` with the form components, so the page no longer has to drill ~24
 * individual props down into `SongDescriptionSimple` / `SongDescriptionCustom`.
 */
type CreateState = ReturnType<typeof useGenerate>;

const Ctx = createContext<CreateState | null>(null);

export function CreateProvider({ children }: { children: ReactNode }) {
  const value = useGenerate();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCreate() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCreate must be used inside <CreateProvider>');
  return ctx;
}
