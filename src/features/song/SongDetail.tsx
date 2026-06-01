'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronIcon,
  DownloadIcon,
  HeartIcon,
  MusicNoteIcon,
  PauseIcon,
  PlayIcon,
} from '@/components/icons';
import { formatDuration } from '@/lib/format';
import { usePlayer } from '@/features/workspace/PlayerContext';
import type { Song } from '@/types/workspace';

/**
 * Full song-detail view (Suno-style `/song/[id]`): large cover, title, metadata,
 * play / download / like actions, style tags and full lyrics. Playback is driven
 * through the shared PlayerContext so the bottom PlayerBar handles the audio.
 */
export default function SongDetail({ id }: { id: string }) {
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isCurrent, toggle } = usePlayer();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`/api/get?ids=${encodeURIComponent(id)}`);
        if (!r.ok) throw new Error(`${r.status}: ${(await r.text()).slice(0, 150)}`);
        const data = await r.json();
        const found: Song | undefined = Array.isArray(data) ? data[0] : undefined;
        if (cancelled) return;
        if (!found) setError('Song not found');
        else setSong(found);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load song');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="w-full max-w-4xl mx-auto text-white pb-28">
      <Link
        href="/create"
        className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white transition-colors mb-6"
      >
        <ChevronIcon className="w-4 h-4 rotate-90" />
        Back to workspace
      </Link>

      {loading ? (
        <DetailSkeleton />
      ) : error ? (
        <div className="bg-red-950/50 border border-red-900/60 text-red-200 rounded-xl p-4 text-sm">
          {error}
        </div>
      ) : song ? (
        <Detail song={song} playing={isCurrent(song.id)} onToggle={() => toggle(song)} />
      ) : null}
    </div>
  );
}

function Detail({
  song,
  playing,
  onToggle,
}: {
  song: Song;
  playing: boolean;
  onToggle: () => void;
}) {
  const ready = !!song.audio_url;
  const cover = song.image_large_url || song.image_url;
  const lyrics = song.prompt || '';
  const tags = (song.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Cover */}
        <div className="w-full sm:w-64 shrink-0">
          <div className="aspect-square w-full rounded-2xl overflow-hidden bg-neutral-800">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={song.title || ''} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-900 via-fuchsia-900 to-blue-900 flex items-center justify-center">
                <MusicNoteIcon className="w-10 h-10 text-white/50" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col">
          <h1 className="text-2xl sm:text-3xl font-bold break-words">
            {song.title?.trim() || 'Untitled'}
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-2">
            {song.model_name && (
              <span className="font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                {song.model_name}
              </span>
            )}
            {typeof song.duration === 'number' && (
              <span className="tabular-nums">{formatDuration(song.duration)}</span>
            )}
            {song.created_at && <span>· {new Date(song.created_at).toLocaleDateString()}</span>}
            {typeof song.play_count === 'number' && song.play_count > 0 && (
              <span>· {song.play_count} plays</span>
            )}
            {song.status && song.status !== 'complete' && (
              <span className="text-amber-400">· {song.status}</span>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((t, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2 py-1 rounded-full bg-neutral-800 text-neutral-300"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-auto pt-5">
            <button
              type="button"
              onClick={onToggle}
              disabled={!ready}
              className="inline-flex items-center gap-2 bg-white text-black font-medium rounded-full px-5 py-2.5 hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {playing ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
              {playing ? 'Pause' : 'Play'}
            </button>

            {ready && (
              <a
                href={buildDownloadHref(song)}
                download
                title="Download MP3"
                className="p-2.5 rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <DownloadIcon className="w-5 h-5" />
              </a>
            )}

            <button
              type="button"
              title={song.is_liked ? 'Liked' : 'Like'}
              className={[
                'p-2.5 rounded-full transition-colors',
                song.is_liked
                  ? 'text-red-400 hover:text-red-300'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800',
              ].join(' ')}
            >
              <HeartIcon className="w-5 h-5" filled={song.is_liked} />
            </button>
          </div>
        </div>
      </div>

      {/* Lyrics */}
      <section className="mt-8">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">
          Lyrics
        </h2>
        {lyrics.trim() ? (
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-neutral-200 bg-neutral-950 border border-neutral-800 rounded-xl p-4">
            {lyrics}
          </pre>
        ) : (
          <p className="text-sm text-neutral-500">No lyrics (instrumental or unavailable).</p>
        )}
      </section>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-6 animate-pulse">
      <div className="w-full sm:w-64 aspect-square rounded-2xl bg-neutral-800 shrink-0" />
      <div className="flex-1 space-y-3 pt-2">
        <div className="h-7 w-2/3 bg-neutral-800 rounded" />
        <div className="h-3 w-1/3 bg-neutral-800 rounded" />
        <div className="h-3 w-1/2 bg-neutral-800 rounded" />
        <div className="h-10 w-40 bg-neutral-800 rounded-full mt-6" />
      </div>
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
