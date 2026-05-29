'use client';

import { useMemo } from 'react';
import CollapsibleCard from './CollapsibleCard';
import StyleChipsRow from './StyleChipsRow';
import { SparklesIcon } from '@/components/icons';
import { STYLE_MAX, STYLE_SUGGESTIONS } from '@/constants/create';

interface Props {
  style: string;
  onStyleChange: (v: string) => void;
  disabled?: boolean;
}

/** Comma-separated string ⇄ tag list helpers. */
function parseTags(s: string): string[] {
  return s
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}
function stringifyTags(tags: string[]): string {
  return tags.join(', ');
}

export default function StylesSection({ style, onStyleChange, disabled }: Props) {
  const tags = useMemo(() => parseTags(style), [style]);

  function addTag(tag: string) {
    if (disabled) return;
    if (tags.includes(tag)) return;
    const next = [...tags, tag];
    onStyleChange(stringifyTags(next).slice(0, STYLE_MAX));
  }

  function randomize() {
    if (disabled) return;
    const shuffled = [...STYLE_SUGGESTIONS].sort(() => Math.random() - 0.5).slice(0, 4);
    onStyleChange(stringifyTags(shuffled));
  }

  const remaining = STYLE_MAX - style.length;

  const headerAction = (
    <button
      type="button"
      title="AI suggest styles"
      onClick={randomize}
      disabled={disabled}
      className="p-1.5 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white hover:from-blue-400 hover:to-blue-600 transition-colors disabled:opacity-40 shadow-sm"
    >
      <SparklesIcon className="w-4 h-4" />
    </button>
  );

  return (
    <CollapsibleCard title="Styles" rightAction={headerAction}>
      <div className="space-y-3">
        {/* Editable styles area — looks like text but is a real input */}
        <div className="relative">
          <textarea
            value={style}
            onChange={(e) => onStyleChange(e.target.value.slice(0, STYLE_MAX))}
            rows={2}
            disabled={disabled}
            placeholder="Describe a style, mood, or genre…"
            className="scrollbar-thin w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-500 resize-none disabled:opacity-50 transition-colors"
          />
          <span
            className={[
              'absolute bottom-3 right-3 text-[10px] tabular-nums pointer-events-none',
              remaining < 30 ? 'text-amber-400' : 'text-neutral-600',
            ].join(' ')}
          >
            {remaining}
          </span>
        </div>

        <StyleChipsRow
          selected={tags}
          onAdd={addTag}
          disabled={disabled}
        />
      </div>
    </CollapsibleCard>
  );
}
