'use client';

import { useEffect, useState } from 'react';
import EqualizerBars from '@/components/EqualizerBars';
import { formatDuration } from '@/lib/format';
import {
  CloseIcon,
  CommentIcon,
  InfoIcon,
  MoreIcon,
  MusicNoteIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  QueueIcon,
  RepeatIcon,
  ShareIcon,
  ShuffleIcon,
  ThumbDownIcon,
  ThumbUpIcon,
  VolumeIcon,
  VolumeMuteIcon,
} from '@/components/icons';
import CtrlBtn from './CtrlBtn';
import { usePlayer } from './PlayerContext';
import { usePlayerAudio } from './usePlayerAudio';

/**
 * Suno-style fixed bottom player.
 * Grid layout (3 columns, equal width):
 *   ┌────────────────┬─────────────────────┬────────────────┐
 *   │ cover · title  │  ⇄  ⏮  ▶  ⏭  ⇆      │  ☰ 👍 👎 💬 ↗ ⋯ 🔊 ⓘ │
 *   │      user      │                     │                │
 *   └────────────────┴─────────────────────┴────────────────┘
 *   ┌─ 0:06 ──────●───────────────────────────────── 5:11 ──┐
 *   └───────────────────────────────────────────────────────┘
 */
export default function PlayerBar() {
  const { current, stop } = usePlayer();
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const { audioRef, paused, muted, time, togglePause, toggleMute, handleTime, seek } =
    usePlayerAudio({ id: current?.id, src: current?.audio_url, loop: repeat });

  const progress = time.total ? time.cur / time.total : 0;

  // Sync liked/disliked when song changes
  useEffect(() => {
    if (current) {
      setLiked(!!current.is_liked);
      setDisliked(false);
    }
  }, [current?.id]);

  if (!current) return null;

  const cover = current.image_url || current.image_large_url;
  const totalDisplay = time.total || current.duration || 0;

  return (
    <div className="fixed bottom-0 left-0 md:left-60 right-0 z-30 bg-neutral-950/95 backdrop-blur border-t border-neutral-800 shadow-2xl">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 pt-3">
        {/* LEFT: cover + title + user */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-12 h-12 rounded-md overflow-hidden bg-neutral-800 shrink-0">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-900 via-fuchsia-900 to-blue-900 flex items-center justify-center">
                <MusicNoteIcon className="w-4 h-4 text-white/50" />
              </div>
            )}
            {/* "Now playing" EQ overlay — only while audio is actively running */}
            {!paused && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <EqualizerBars />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {current.title?.trim() || 'Untitled'}
            </p>
            <p className="text-xs text-neutral-500 truncate">
              {current.model_name || current.tags?.split(',')[0] || '—'}
            </p>
          </div>
        </div>

        {/* CENTER: shuffle · prev · PLAY · next · repeat */}
        <div className="flex items-center gap-4 justify-self-center">
          <CtrlBtn
            label="Shuffle"
            active={shuffle}
            onClick={() => setShuffle((v) => !v)}
          >
            <ShuffleIcon className="w-4 h-4" />
          </CtrlBtn>
          <CtrlBtn label="Previous" disabled>
            <PrevIcon className="w-5 h-5" />
          </CtrlBtn>
          <button
            type="button"
            onClick={togglePause}
            aria-label={paused ? 'Play' : 'Pause'}
            className="w-11 h-11 rounded-full bg-white text-black hover:bg-neutral-200 flex items-center justify-center transition-transform hover:scale-105 shadow"
          >
            {paused ? <PlayIcon className="w-5 h-5" /> : <PauseIcon className="w-5 h-5" />}
          </button>
          <CtrlBtn label="Next" disabled>
            <NextIcon className="w-5 h-5" />
          </CtrlBtn>
          <CtrlBtn
            label="Repeat"
            active={repeat}
            onClick={() => setRepeat((v) => !v)}
          >
            <RepeatIcon className="w-4 h-4" />
          </CtrlBtn>
        </div>

        {/* RIGHT: action cluster */}
        <div className="flex items-center justify-end gap-0.5">
          <CtrlBtn label="Queue">
            <QueueIcon className="w-4 h-4" />
          </CtrlBtn>
          <CtrlBtn
            label="Like"
            active={liked}
            activeColor="text-white"
            onClick={() => {
              setLiked((v) => !v);
              if (disliked) setDisliked(false);
            }}
          >
            <ThumbUpIcon className="w-4 h-4" filled={liked} />
          </CtrlBtn>
          <CtrlBtn
            label="Dislike"
            active={disliked}
            activeColor="text-white"
            onClick={() => {
              setDisliked((v) => !v);
              if (liked) setLiked(false);
            }}
          >
            <ThumbDownIcon className="w-4 h-4" filled={disliked} />
          </CtrlBtn>
          <CtrlBtn label="Comment">
            <CommentIcon className="w-4 h-4" />
          </CtrlBtn>
          <CtrlBtn label="Share">
            <ShareIcon className="w-4 h-4" />
          </CtrlBtn>
          <CtrlBtn label="More">
            <MoreIcon className="w-4 h-4" />
          </CtrlBtn>
          <CtrlBtn label={muted ? 'Unmute' : 'Mute'} onClick={toggleMute}>
            {muted ? <VolumeMuteIcon className="w-4 h-4" /> : <VolumeIcon className="w-4 h-4" />}
          </CtrlBtn>
          <CtrlBtn label="Info">
            <InfoIcon className="w-4 h-4" />
          </CtrlBtn>
          <CtrlBtn label="Close" onClick={stop}>
            <CloseIcon className="w-4 h-4" />
          </CtrlBtn>
        </div>
      </div>

      {/* Progress row */}
      <div className="flex items-center gap-3 px-6 pb-2 pt-2">
        <span className="text-[11px] tabular-nums text-neutral-500 w-10 text-right">
          {formatDuration(time.cur)}
        </span>
        <div
          onClick={seek}
          className="flex-1 h-1 bg-neutral-800 rounded-full cursor-pointer group relative"
          title="Seek"
        >
          <div
            className="h-full bg-white rounded-full transition-[width] duration-100 relative"
            style={{ width: `${progress * 100}%` }}
          >
            <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow" />
          </div>
        </div>
        <span className="text-[11px] tabular-nums text-neutral-500 w-10">
          {formatDuration(totalDisplay)}
        </span>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTime}
        onLoadedMetadata={handleTime}
        onEnded={() => !repeat && stop()}
        preload="metadata"
      />
    </div>
  );
}
