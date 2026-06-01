'use client';

import { CloseIcon, SearchIcon } from '@/components/icons';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/** Search box that filters the loaded workspace songs by name. */
export default function SongSearch({ value, onChange }: Props) {
  return (
    <div className="relative">
      <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search songs by name…"
        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-9 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          title="Clear"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
