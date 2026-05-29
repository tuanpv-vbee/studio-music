'use client';

import { STYLE_SUGGESTIONS } from '@/constants/create';

interface Props {
  /** Tags already in the style textarea — filtered out of suggestions. */
  selected: string[];
  /** Append a tag to the style string. */
  onAdd: (tag: string) => void;
  disabled?: boolean;
}

/**
 * Style suggestions as a wrapping chip cloud — matches Simple's `flex-wrap gap-2`
 * pattern. Clicking a chip appends it to style + removes it from the cloud
 * (filter is derived from `selected`, so editing the textarea brings it back).
 */
export default function StyleChipsRow({ selected, onAdd, disabled }: Props) {
  const available = STYLE_SUGGESTIONS.filter((t) => !selected.includes(t));

  if (available.length === 0) {
    return (
      <p className="text-xs text-neutral-600 italic px-1">
        All suggestions used · type a new tag or press ✨ to reshuffle
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {available.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onAdd(tag)}
          disabled={disabled}
          className="px-3 py-1 rounded-full border border-neutral-700 text-xs text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors disabled:opacity-40"
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
