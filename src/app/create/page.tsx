'use client';

import { useEffect, useRef } from 'react';
import ClipCard from '@/components/ClipCard';
import SongDescriptionCustom from '@/features/create/SongDescriptionCustom';
import SongDescriptionSimple from '@/features/create/SongDescriptionSimple';
import { CreateProvider, useCreate } from '@/features/create/CreateContext';
import PlayerBar from '@/features/workspace/PlayerBar';
import { PlayerProvider } from '@/features/workspace/PlayerContext';
import Workspace, { type WorkspaceHandle } from '@/features/workspace/Workspace';

export default function CreatePage() {
  return (
    <CreateProvider>
      <PlayerProvider>
        <CreateContent />
        <PlayerBar />
      </PlayerProvider>
    </CreateProvider>
  );
}

function CreateContent() {
  const { mode, setMode, clips, phase, error } = useCreate();

  const busy = phase === 'submitting' || phase === 'polling';
  const workspaceRef = useRef<WorkspaceHandle>(null);

  // When a generation finishes, refresh the workspace so the new song appears.
  useEffect(() => {
    if (phase === 'done') workspaceRef.current?.refresh();
  }, [phase]);

  return (
    <main className="flex flex-col lg:flex-row gap-6 text-white max-w-[1400px] mx-auto pb-24">
      {/* LEFT — sticky form column. Scrolls inside itself if taller than viewport. */}
      <aside
        className={[
          'w-full lg:w-[460px] lg:shrink-0 space-y-4',
          // sticky + self-start + max-h so a tall Custom form scrolls within column,
          // not the page — matches Suno's pinned sidebar.
          'lg:sticky lg:top-6 lg:self-start',
          'lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto scrollbar-thin lg:pr-2',
        ].join(' ')}
      >
        {/* Mode tabs */}
        <div className="flex gap-1 p-1 bg-neutral-900 rounded-xl w-fit border border-neutral-800">
          {(['simple', 'custom'] as const).map((m) => (
            <button
              key={m}
              onClick={() => !busy && setMode(m)}
              disabled={busy}
              className={[
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize',
                mode === m
                  ? 'bg-neutral-700 text-white'
                  : 'text-neutral-400 hover:text-neutral-200 disabled:opacity-40',
              ].join(' ')}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Form */}
        {mode === 'simple' ? <SongDescriptionSimple /> : <SongDescriptionCustom />}

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-200 rounded-lg p-3 text-sm whitespace-pre-wrap">
            {error}
          </div>
        )}
      </aside>

      {/* RIGHT — workspace + live in-flight clips. */}
      <section className="flex-1 min-w-0 space-y-6">
        {busy && clips.length > 0 && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest">
                In progress
              </span>
              <span className="text-[10px] text-neutral-600">auto-refreshes every 5s</span>
            </div>
            {clips.map((clip) => (
              <ClipCard key={clip.id} clip={clip} />
            ))}
          </div>
        )}

        <Workspace ref={workspaceRef} />
      </section>
    </main>
  );
}
