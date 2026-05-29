'use client';

import StatusBadge from '@/components/StatusBadge';
import type { Song } from '@/types/workspace';

interface Props {
  song: Song;
  className?: string;
}

const FINISHED = new Set(['complete', 'streaming']);

export default function SongMeta({ song, className = '' }: Props) {
  const duration = song.duration ? formatDuration(song.duration) : null;
  const created = song.created_at ? formatRelative(song.created_at) : null;
  const subtitle = song.tags || song.gpt_description_prompt || song.prompt?.slice(0, 80) || '—';

  return (
    <div className={`min-w-0 ${className}`}>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-white truncate">
          {song.title?.trim() || 'Untitled'}
        </h3>
        {!FINISHED.has(song.status) && <StatusBadge status={song.status} />}
      </div>
      <p className="text-xs text-neutral-500 truncate mt-0.5">{subtitle}</p>
      <div className="flex items-center gap-2 text-[10px] text-neutral-600 mt-1">
        {song.model_name && <span className="font-mono">{song.model_name}</span>}
        {duration && (
          <>
            <span className="text-neutral-800">•</span>
            <span className="tabular-nums">{duration}</span>
          </>
        )}
        {created && (
          <>
            <span className="text-neutral-800">•</span>
            <span>{created}</span>
          </>
        )}
        {typeof song.play_count === 'number' && song.play_count > 0 && (
          <>
            <span className="text-neutral-800">•</span>
            <span className="tabular-nums">{song.play_count} plays</span>
          </>
        )}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604_800) return `${Math.floor(diff / 86_400)}d ago`;
  return d.toLocaleDateString();
}
