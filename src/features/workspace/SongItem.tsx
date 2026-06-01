'use client';

import Link from 'next/link';
import { usePlayer } from './PlayerContext';
import SongActions from './SongActions';
import SongCover from './SongCover';
import SongMeta from './SongMeta';
import type { Song } from '@/types/workspace';

interface Props {
  song: Song;
}

/**
 * One row of the workspace list. Click the cover to play in the bottom
 * `PlayerBar` — there is no inline audio, so picking another song stops the
 * previous one for free.
 */
export default function SongItem({ song }: Props) {
  const { isCurrent, toggle } = usePlayer();
  const playing = isCurrent(song.id);
  const ready = !!song.audio_url;

  return (
    <div
      className={[
        'bg-neutral-900 border rounded-xl p-3 flex items-center gap-3 transition-colors',
        playing
          ? 'border-white/30 ring-1 ring-white/10'
          : 'border-neutral-800 hover:border-neutral-700',
      ].join(' ')}
    >
      <SongCover
        song={song}
        playing={playing}
        onPlayToggle={() => ready && toggle(song)}
      />
      <Link
        href={`/song/${song.id}`}
        className="flex-1 min-w-0 group/meta"
        title="View song details"
      >
        <SongMeta song={song} />
      </Link>
      <SongActions song={song} />

      {!ready && song.status === 'error' && song.error_message && (
        <div className="basis-full text-xs text-red-400 pt-1">❌ {song.error_message}</div>
      )}
    </div>
  );
}
