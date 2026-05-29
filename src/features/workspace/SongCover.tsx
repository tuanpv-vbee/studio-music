'use client';

import EqualizerBars from '@/components/EqualizerBars';
import { MusicNoteIcon, PauseIcon, PlayIcon } from '@/components/icons';
import type { Song } from '@/types/workspace';

interface Props {
  song: Song;
  playing: boolean;
  onPlayToggle: () => void;
}

/**
 * 56px square cover with overlay states:
 *  - Idle               → just the image
 *  - Hover (not playing) → dim + play icon
 *  - Playing (idle)      → dim + bouncing EQ bars
 *  - Playing (hover)     → dim + pause icon (replaces EQ for click affordance)
 */
export default function SongCover({ song, playing, onPlayToggle }: Props) {
  const ready = !!song.audio_url;
  const cover = song.image_url || song.image_large_url;

  return (
    <button
      type="button"
      onClick={onPlayToggle}
      disabled={!ready}
      title={ready ? (playing ? 'Pause' : 'Play') : 'Not ready'}
      className="relative w-14 h-14 rounded-lg overflow-hidden bg-neutral-800 group shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-violet-900 via-fuchsia-900 to-blue-900 flex items-center justify-center">
          <MusicNoteIcon className="w-5 h-5 text-white/50" />
        </div>
      )}

      <div
        className={[
          'absolute inset-0 flex items-center justify-center bg-black/55 transition-opacity',
          playing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        ].join(' ')}
      >
        {playing ? (
          <>
            <EqualizerBars className="group-hover:hidden" />
            <PauseIcon className="w-5 h-5 text-white hidden group-hover:block" />
          </>
        ) : (
          <PlayIcon className="w-5 h-5 text-white" />
        )}
      </div>
    </button>
  );
}
