'use client';

import { MODELS } from '@/constants/create';

interface Props {
  model: string;
  onModelChange: (v: string) => void;
  disabled?: boolean;
}

/** Compact model dropdown — sits in the bottom CreateBar, Suno-style. */
export default function ModelSelect({ model, onModelChange, disabled }: Props) {
  return (
    <select
      value={model}
      onChange={(e) => onModelChange(e.target.value)}
      disabled={disabled}
      className="bg-neutral-800/60 border border-neutral-700 hover:border-neutral-600 rounded-full px-3 py-1.5 text-xs text-neutral-200 outline-none focus:border-neutral-500 disabled:opacity-50 cursor-pointer transition-colors"
    >
      {MODELS.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  );
}
