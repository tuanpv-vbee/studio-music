'use client';

import { DownloadIcon, HeartIcon, MoreIcon } from '@/components/icons';
import type { Song } from '@/types/workspace';

interface Props {
  song: Song;
}

export default function SongActions({ song }: Props) {
  const ready = !!song.audio_url;

  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <button
        type="button"
        title={song.is_liked ? 'Liked' : 'Like'}
        className={[
          'p-2 rounded-lg transition-colors',
          song.is_liked
            ? 'text-red-400 hover:text-red-300'
            : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800',
        ].join(' ')}
      >
        <HeartIcon className="w-4 h-4" filled={song.is_liked} />
      </button>

      {ready && (
        <a
          // Route through our /api/download proxy so Content-Disposition triggers
          // a real save dialog — the native `download` attribute is ignored on
          // cross-origin URLs like Suno's CDN.
          href={buildDownloadHref(song)}
          download
          title="Download MP3"
          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
        >
          <DownloadIcon className="w-4 h-4" />
        </a>
      )}

      <button
        type="button"
        title="More"
        className="p-2 rounded-lg text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
      >
        <MoreIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

function buildDownloadHref(song: Song): string {
  const params = new URLSearchParams({
    url: song.audio_url!,
    filename: (song.title?.trim() || song.id) + '.mp3',
  });
  return `/api/download?${params.toString()}`;
}
