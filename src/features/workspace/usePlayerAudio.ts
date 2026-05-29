'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Owns the imperative `<audio>` element wiring for the bottom player: autoplay
 * on track change, loop syncing, play/pause + mute toggles, time tracking, and
 * click-to-seek. The component keeps the UI-only state (shuffle/repeat/like).
 */
export function usePlayerAudio({
  id,
  src,
  loop,
}: {
  id?: string;
  src?: string;
  loop: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState({ cur: 0, total: 0 });

  // Autoplay whenever the loaded track changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    audio.src = src;
    audio.currentTime = 0;
    audio.loop = loop;
    audio.play().catch(() => {});
    setPaused(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, src]);

  // Keep the loop flag in sync when repeat toggles.
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loop;
  }, [loop]);

  function togglePause() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
      setPaused(false);
    } else {
      audio.pause();
      setPaused(true);
    }
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  }

  function handleTime() {
    const audio = audioRef.current;
    if (!audio) return;
    setTime({ cur: audio.currentTime, total: audio.duration || 0 });
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
  }

  return { audioRef, paused, muted, time, togglePause, toggleMute, handleTime, seek };
}
