'use client';

import type { Song } from '@/types/workspace';

/**
 * A "fake" song row shown at the top of the workspace list while a generation
 * is in flight. Mirrors SongItem's layout but renders a spinner + skeleton
 * instead of a playable clip. Replaced by the real song once generation
 * finishes and the workspace refreshes.
 */
export default function PendingSongItem({ clip }: { clip: Song }) {
  const isError = clip.status === 'error';
  const label = clip.title?.trim() || 'Generating…';
  const statusText = isError
    ? clip.error_message || 'Generation failed'
    : 'Creating your song…';

  return (
    <div
      className={[
        'bg-neutral-900 border rounded-xl p-3 flex items-center gap-3',
        isError ? 'border-red-900/60' : 'border-white/10',
      ].join(' ')}
    >
      <div className="w-14 h-14 rounded-lg bg-neutral-800 shrink-0 grid place-items-center">
        {isError ? (
          <span className="text-red-400 text-lg">❌</span>
        ) : (
          <span className="w-5 h-5 rounded-full border-2 border-neutral-600 border-t-white animate-spin" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="text-sm text-neutral-300 truncate">{label}</div>
        <div className="h-2 w-2/3 bg-neutral-800 rounded animate-pulse" />
        <div className={['text-[11px]', isError ? 'text-red-400' : 'text-neutral-500'].join(' ')}>
          {statusText}
        </div>
      </div>
    </div>
  );
}
