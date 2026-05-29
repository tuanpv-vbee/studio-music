'use client';

import { useEffect, useRef, useState } from 'react';
import type { Clip, GeneratePhase, VocalGender } from '@/types/create';
import { TERMINAL_STATUSES } from '@/constants/create';

export type CreateMode = 'simple' | 'custom';

export function useGenerate() {
  // shared
  const [mode, setMode] = useState<CreateMode>('simple');
  const [instrumental, setInstrumental] = useState(false);
  const [model, setModel] = useState('');
  const [clips, setClips] = useState<Clip[]>([]);
  const [phase, setPhase] = useState<GeneratePhase>('idle');
  const [error, setError] = useState<string | null>(null);

  // simple mode
  const [prompt, setPrompt] = useState('');

  // custom mode
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState('');
  const [title, setTitle] = useState('');
  const [negativeTags, setNegativeTags] = useState('');

  // custom mode — advanced
  const [personaId, setPersonaId] = useState('');
  const [weirdness, setWeirdness] = useState(0.5); // 0..1
  const [styleInfluence, setStyleInfluence] = useState(0.5); // 0..1
  const [vocalGender, setVocalGender] = useState<VocalGender>('off');
  const [songCount, setSongCount] = useState<1 | 2>(2);

  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  function pollLoop(ids: string[], deadline: number) {
    if (Date.now() > deadline) {
      setError('Timed out after 5 minutes — audio is not ready yet');
      setPhase('idle');
      return;
    }
    pollTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/get?ids=${ids.join(',')}`);
        const data: Clip[] = await r.json();
        setClips(data);
        if (data.every((c) => TERMINAL_STATUSES.has(c.status))) {
          setPhase('done');
          return;
        }
      } catch {
        // network blip — retry next tick
      }
      pollLoop(ids, deadline);
    }, 5000);
  }

  async function generate() {
    const busy = phase === 'submitting' || phase === 'polling';
    if (busy) return;

    const isCustom = mode === 'custom';
    if (isCustom && !style.trim() && !lyrics.trim()) return;
    if (!isCustom && !prompt.trim()) return;

    setError(null);
    setClips([]);
    setPhase('submitting');

    try {
      const endpoint = isCustom ? '/api/custom_generate' : '/api/generate';
      const body = isCustom
        ? {
            prompt: lyrics,
            tags: style,
            title,
            negative_tags: negativeTags,
            make_instrumental: instrumental,
            ...(model && { model }),
            // Advanced — backend forwards these into Suno metadata if supported
            ...(personaId && { persona_id: personaId }),
            weirdness_constraint: weirdness,
            style_weight: styleInfluence,
            ...(vocalGender !== 'off' && { vocal_gender: vocalGender }),
            wait_audio: false,
          }
        : {
            prompt,
            make_instrumental: instrumental,
            ...(model && { model }),
            wait_audio: false,
          };

      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        const text = await r.text();
        throw new Error(`${r.status}: ${text.slice(0, 300)}`);
      }

      const initial: Clip[] = await r.json();
      setClips(initial);
      setPhase('polling');
      pollLoop(
        initial.map((c) => c.id),
        Date.now() + 5 * 60_000
      );
    } catch (e: any) {
      setError(e.message ?? String(e));
      setPhase('idle');
    }
  }

  return {
    mode, setMode,
    prompt, setPrompt,
    lyrics, setLyrics,
    style, setStyle,
    title, setTitle,
    negativeTags, setNegativeTags,
    instrumental, setInstrumental,
    model, setModel,
    // advanced
    personaId, setPersonaId,
    weirdness, setWeirdness,
    styleInfluence, setStyleInfluence,
    vocalGender, setVocalGender,
    songCount, setSongCount,
    // out
    clips,
    phase,
    error,
    generate,
  };
}
