'use client';

import { VocalGender } from '@/types/create';

interface Props {
  value: VocalGender;
  onChange: (v: VocalGender) => void;
  disabled?: boolean;
}

const OPTIONS: { value: VocalGender; label: string }[] = [
  { value: 'off', label: 'Auto' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
];

export default function VocalGenderChips({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-neutral-300">Vocal Gender</span>
      <div className="flex gap-1.5">
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              disabled={disabled}
              className={[
                'flex-1 px-3 py-1.5 rounded-lg border text-xs transition-colors disabled:opacity-50',
                active
                  ? 'bg-white text-black border-white hover:bg-neutral-200'
                  : 'bg-neutral-800/60 text-neutral-300 border-neutral-700 hover:border-neutral-500 hover:text-white',
              ].join(' ')}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
