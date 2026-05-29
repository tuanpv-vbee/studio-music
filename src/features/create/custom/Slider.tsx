'use client';

interface Props {
  label: string;
  value: number; // 0..1
  onChange: (v: number) => void;
  /** Shown right of the label, e.g. "More structured ↔ More weird". */
  hint?: string;
  disabled?: boolean;
}

/**
 * Suno-style slider: full-width track, white thumb, value chip on the right.
 * `value` is normalized 0..1 — UI shows it as a percentage.
 */
export default function Slider({ label, value, onChange, hint, disabled }: Props) {
  const pct = Math.round(value * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-300">{label}</span>
        <span className="text-[11px] tabular-nums text-neutral-400 bg-neutral-800/80 px-1.5 py-0.5 rounded">
          {pct}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={pct}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-full accent-white h-1 cursor-pointer disabled:opacity-50"
        style={{
          // Tailwind has limited slider support — small tint adjustment via CSS var
          colorScheme: 'dark',
        }}
      />
      {hint && <p className="text-[10px] text-neutral-600">{hint}</p>}
    </div>
  );
}
