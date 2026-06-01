'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useWorkspace } from '@/hooks/useWorkspace';
import SongList from './SongList';
import SongSearch from './SongSearch';
import WorkspaceHeader from './WorkspaceHeader';
import type { Song } from '@/types/workspace';

export interface WorkspaceHandle {
  refresh: () => void;
}

interface WorkspaceProps {
  /** In-flight generations to show as skeleton cards atop the list. */
  pendingClips?: Song[];
}

const Workspace = forwardRef<WorkspaceHandle, WorkspaceProps>(function Workspace(
  { pendingClips = [] },
  ref
) {
  const { songs, loading, loadingMore, hasMore, error, search, setSearch, refresh, loadMore } =
    useWorkspace();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const searching = search.trim().length > 0;

  // Stable refs so the observer closure never goes stale
  const hasMoreRef = useRef(hasMore);
  const loadingMoreRef = useRef(loadingMore);
  const loadMoreRef = useRef(loadMore);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { loadingMoreRef.current = loadingMore; }, [loadingMore]);
  useEffect(() => { loadMoreRef.current = loadMore; }, [loadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollRef.current;
    if (!sentinel || !container) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreRef.current && !loadingMoreRef.current) {
          loadMoreRef.current();
        }
      },
      { root: container, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({ refresh }), [refresh]);

  return (
    <section className="bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col lg:sticky lg:top-6 lg:h-[calc(100vh-5rem)]">
      <div className="px-5 pt-5 pb-4 shrink-0 space-y-3">
        <WorkspaceHeader count={songs.length} loading={loading} onRefresh={refresh} />
        <SongSearch value={search} onChange={setSearch} />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-5 pb-5">
        {error ? (
          <div className="bg-red-950/50 border border-red-900/60 text-red-200 rounded-xl p-3 text-xs whitespace-pre-wrap">
            {error}
          </div>
        ) : (
          <>
            <SongList
              songs={songs}
              loading={loading}
              loadingMore={loadingMore}
              pendingClips={searching ? [] : pendingClips}
              searching={searching}
            />
            <div ref={sentinelRef} className="h-1" />
          </>
        )}
      </div>
    </section>
  );
});

export default Workspace;
