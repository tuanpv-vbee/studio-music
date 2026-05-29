'use client';

interface Props {
  value: 1 | 2;
  onChange: (v: 1 | 2) => void;
  disabled?: boolean;
}

/** Segmented pill — Suno generates 2 songs by default, allows toggling to 1. */
export default function SongCountToggle({ value, onChange, disabled }: Props) {
  return (
    <div className="flex bg-neutral-800/60 rounded-full p-0.5 text-xs">
      {([1, 2] as const).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          disabled={disabled}
          title={`Generate ${n} song${n > 1 ? 's' : ''}`}
          className={[
            'px-3 py-1 rounded-full transition-colors tabular-nums disabled:opacity-50',
            value === n
              ? 'bg-neutral-700 text-white'
              : 'text-neutral-400 hover:text-neutral-200',
          ].join(' ')}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
