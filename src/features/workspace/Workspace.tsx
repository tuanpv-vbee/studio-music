'use client';

import { forwardRef, useImperativeHandle } from 'react';
import { useWorkspace } from '@/hooks/useWorkspace';
import SongList from './SongList';
import WorkspaceHeader from './WorkspaceHeader';

export interface WorkspaceHandle {
  refresh: () => void;
}

/**
 * "My Workspace" panel — outer card matching the Simple/Custom form shells.
 * Fetches /api/get on mount; parent can imperatively trigger refresh via ref
 * (e.g. after a successful generation completes).
 */
const Workspace = forwardRef<WorkspaceHandle>(function Workspace(_, ref) {
  const { songs, loading, error, refresh } = useWorkspace();

  useImperativeHandle(ref, () => ({ refresh }), [refresh]);

  return (
    <section className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4">
      <WorkspaceHeader count={songs.length} loading={loading} onRefresh={refresh} />

      {error ? (
        <div className="bg-red-950/50 border border-red-900/60 text-red-200 rounded-xl p-3 text-xs whitespace-pre-wrap">
          {error}
        </div>
      ) : (
        <SongList songs={songs} loading={loading} />
      )}
    </section>
  );
});

export default Workspace;
