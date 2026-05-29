'use client';

import { MODELS, SUGGESTION_TAGS } from '@/constants/create';
import { InstrumentalIcon, PlusIcon, SpinnerIcon } from '@/components/icons';
import { useCreate } from './CreateContext';

export default function SongDescriptionSimple() {
  const {
    prompt,
    setPrompt: onPromptChange,
    instrumental,
    setInstrumental: onInstrumentalChange,
    model,
    setModel: onModelChange,
    phase,
    generate: onSubmit,
  } = useCreate();

  const busy = phase === 'submitting' || phase === 'polling';
  const remaining = 3000 - prompt.length;

  function appendSuggestion(tag: string) {
    if (busy) return;
    const sep = prompt.trim() ? ', ' : '';
    onPromptChange((prompt + sep + tag).slice(0, 3000));
  }

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest">
          Simple
        </span>
        <select
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={busy}
          className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-neutral-500 disabled:opacity-50"
        >
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={5}
          maxLength={3000}
          placeholder={
            'Describe the song you want to create…\n' +
            'e.g. A melancholic indie pop song about missing someone, female vocal, rainy night vibe'
          }
          disabled={busy}
          className="scrollbar-thin w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-500 resize-none disabled:opacity-50 transition-colors"
        />
        <span
          className={[
            'absolute bottom-3 right-3 text-[10px] tabular-nums pointer-events-none',
            remaining < 100 ? 'text-amber-400' : 'text-neutral-600',
          ].join(' ')}
        >
          {remaining}
        </span>
      </div>

      {/* Suggestion tags */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTION_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => appendSuggestion(tag)}
            disabled={busy}
            className="px-3 py-1 rounded-full border border-neutral-700 text-xs text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors disabled:opacity-40"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => onInstrumentalChange(!instrumental)}
          disabled={busy}
          className={[
            'flex items-center gap-2 text-xs rounded-full px-3 py-1.5 border transition-colors disabled:opacity-50',
            instrumental
              ? 'border-violet-500 text-violet-400 bg-violet-950'
              : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200',
          ].join(' ')}
        >
          <InstrumentalIcon className="w-3.5 h-3.5" />
          Instrumental
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={busy || !prompt.trim()}
          className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-5 py-2 rounded-xl hover:bg-neutral-200 disabled:opacity-40 transition-colors"
        >
          {busy ? (
            <>
              <SpinnerIcon className="w-4 h-4 animate-spin" />
              {phase === 'submitting' ? 'Sending…' : 'Rendering…'}
            </>
          ) : (
            <>
              <PlusIcon className="w-4 h-4" />
              Create song
            </>
          )}
        </button>
      </div>
    </div>
  );
}
