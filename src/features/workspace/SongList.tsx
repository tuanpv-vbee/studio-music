'use client';

import SongItem from './SongItem';
import PendingSongItem from './PendingSongItem';
import type { Song } from '@/types/workspace';

interface Props {
  songs: Song[];
  loading: boolean;
  loadingMore?: boolean;
  /** In-flight generations rendered as skeleton cards at the top of the list. */
  pendingClips?: Song[];
  /** True when a search query is active — changes the empty-state message. */
  searching?: boolean;
}

export default function SongList({ songs, loading, loadingMore, pendingClips = [], searching = false }: Props) {
  if (loading && songs.length === 0 && pendingClips.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex items-center gap-3 animate-pulse"
          >
            <div className="w-14 h-14 rounded-lg bg-neutral-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 bg-neutral-800 rounded" />
              <div className="h-2 w-2/3 bg-neutral-800 rounded" />
              <div className="h-2 w-1/4 bg-neutral-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (songs.length === 0 && pendingClips.length === 0) {
    return (
      <div className="text-center py-12 px-4 border border-dashed border-neutral-800 rounded-xl">
        <p className="text-sm text-neutral-400">
          {searching ? 'No matching songs' : 'No songs yet'}
        </p>
        <p className="text-xs text-neutral-600 mt-1">
          {searching
            ? 'Try a different name, or scroll to load more.'
            : 'Create your first song — it will appear here.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pendingClips.map((c, i) => (
        <PendingSongItem key={c.id ?? `pending-${i}`} clip={c} />
      ))}

      {songs.map((s) => (
        <SongItem key={s.id} song={s} />
      ))}

      {loadingMore && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex items-center gap-3 animate-pulse"
            >
              <div className="w-14 h-14 rounded-lg bg-neutral-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 bg-neutral-800 rounded" />
                <div className="h-2 w-2/3 bg-neutral-800 rounded" />
                <div className="h-2 w-1/4 bg-neutral-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
