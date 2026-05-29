'use client';

import { TITLE_MAX } from '@/constants/create';

interface Props {
  title: string;
  onTitleChange: (v: string) => void;
  disabled?: boolean;
}

/**
 * Title card — Suno keeps Title at the bottom of Advanced, just above the
 * action bar. Single labeled input, optional, capped at 100 chars.
 */
export default function TitleSection({ title, onTitleChange, disabled }: Props) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 space-y-2">
      <label className="block text-sm font-medium text-neutral-200">Title</label>
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value.slice(0, TITLE_MAX))}
        disabled={disabled}
        placeholder="Add a title (optional)"
        className="w-full bg-neutral-950/60 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-neutral-600 disabled:opacity-50 transition-colors"
      />
    </div>
  );
}
