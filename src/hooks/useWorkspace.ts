'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Song } from '@/types/workspace';

/**
 * Fetches the user's recent song feed from /api/get (no `ids` → returns all
 * songs across the account). Exposes `refresh()` so the page can re-pull after
 * a generation completes.
 */
export function useWorkspace() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/get');
      if (!r.ok) {
        const text = await r.text();
        throw new Error(`${r.status}: ${text.slice(0, 200)}`);
      }
      const data = await r.json();
      setSongs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load workspace');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { songs, loading, error, refresh };
}
