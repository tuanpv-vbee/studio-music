'use client';

import { GeneratePhase } from '@/types/create';
import ModelSelect from './ModelSelect';
import SongCountToggle from './SongCountToggle';
import { InstrumentalIcon, PlusIcon, SpinnerIcon } from '@/components/icons';

interface Props {
  instrumental: boolean;
  onInstrumentalChange: (v: boolean) => void;
  songCount: 1 | 2;
  onSongCountChange: (v: 1 | 2) => void;
  model: string;
  onModelChange: (v: string) => void;
  onSubmit: () => void;
  canSubmit: boolean;
  phase: GeneratePhase;
}

const CREDITS_PER_SONG = 5;

/**
 * Sticky bottom bar matching Suno's:
 *   [Instrumental]  [1|2]  [model ▾]  ······  [+ Create N credits]
 */
export default function CreateBar({
  instrumental,
  onInstrumentalChange,
  songCount,
  onSongCountChange,
  model,
  onModelChange,
  onSubmit,
  canSubmit,
  phase,
}: Props) {
  const busy = phase === 'submitting' || phase === 'polling';
  const credits = songCount * CREDITS_PER_SONG;

  return (
    <div className="pt-4 border-t border-neutral-800">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Left controls */}
        <button
          type="button"
          onClick={() => onInstrumentalChange(!instrumental)}
          disabled={busy}
          className={[
            'flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 border transition-colors disabled:opacity-50',
            instrumental
              ? 'border-violet-500 text-violet-300 bg-violet-950/50'
              : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200',
          ].join(' ')}
        >
          <InstrumentalIcon className="w-3.5 h-3.5" />
          Instrumental
        </button>

        <SongCountToggle value={songCount} onChange={onSongCountChange} disabled={busy} />

        <ModelSelect model={model} onModelChange={onModelChange} disabled={busy} />

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy || !canSubmit}
            className="flex items-center gap-2 bg-white text-black text-sm font-semibold pl-4 pr-3 py-2 rounded-full hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow"
          >
            {busy ? (
              <>
                <SpinnerIcon className="w-4 h-4 animate-spin" />
                {phase === 'submitting' ? 'Sending…' : 'Rendering…'}
              </>
            ) : (
              <>
                <PlusIcon className="w-4 h-4" />
                <span>Create</span>
                <span className="ml-1 px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700 text-[10px] font-medium tabular-nums">
                  {credits}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
