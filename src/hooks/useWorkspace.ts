'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Song } from '@/types/workspace';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

export function useWorkspace() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // feed/v3 is cursor-based: the next page is fetched with the id of the last
  // clip we've seen. Refs keep refresh()/loadMore() identity stable.
  const cursorRef = useRef<string | null>(null);
  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const fetchFeed = useCallback(
    async (cursor: string | null, searchText: string) => {
      const params = new URLSearchParams();
      if (searchText.trim()) params.set('search', searchText.trim());
      if (cursor) params.set('cursor', cursor);
      const r = await fetch(`/api/get?${params.toString()}`);
      if (!r.ok) {
        const text = await r.text();
        throw new Error(`${r.status}: ${text.slice(0, 200)}`);
      }
      const data = await r.json();
      return Array.isArray(data) ? (data as Song[]) : [];
    },
    []
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    cursorRef.current = null;
    try {
      const data = await fetchFeed(null, searchRef.current);
      setSongs(data);
      cursorRef.current = data.length ? data[data.length - 1].id : null;
      setHasMore(data.length >= PAGE_SIZE);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load workspace');
    } finally {
      setLoading(false);
    }
  }, [fetchFeed]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !cursorRef.current) return;
    setLoadingMore(true);
    const sentCursor = cursorRef.current;
    try {
      const data = await fetchFeed(sentCursor, searchRef.current);
      const newCursor = data.length ? data[data.length - 1].id : null;
      // Stop if the page is empty or didn't advance (guards against an
      // ignored/incorrect cursor returning the same page forever).
      if (data.length === 0 || newCursor === sentCursor) {
        setHasMore(false);
      } else {
        setSongs((prev) => {
          const seen = new Set(prev.map((s) => s.id));
          return [...prev, ...data.filter((s) => !seen.has(s.id))];
        });
        cursorRef.current = newCursor;
        setHasMore(data.length >= PAGE_SIZE);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, fetchFeed]);

  // Initial load + debounced re-fetch whenever the search term changes.
  useEffect(() => {
    const delay = search.trim() ? SEARCH_DEBOUNCE_MS : 0;
    const t = setTimeout(() => {
      void refresh();
    }, delay);
    return () => clearTimeout(t);
  }, [search, refresh]);

  return {
    songs,
    loading,
    loadingMore,
    hasMore,
    error,
    search,
    setSearch,
    refresh,
    loadMore,
  };
}
