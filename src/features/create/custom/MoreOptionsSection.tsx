'use client';

import { VocalGender } from '@/types/create';
import CollapsibleCard from './CollapsibleCard';
import Slider from './Slider';
import VocalGenderChips from './VocalGenderChips';
import { NEGATIVE_MAX } from '@/constants/create';

interface Props {
  weirdness: number;
  onWeirdnessChange: (v: number) => void;
  styleInfluence: number;
  onStyleInfluenceChange: (v: number) => void;
  vocalGender: VocalGender;
  onVocalGenderChange: (v: VocalGender) => void;
  negativeTags: string;
  onNegativeTagsChange: (v: string) => void;
  disabled?: boolean;
}

/**
 * Suno's "More options" panel — collapsed by default. Houses everything that
 * isn't the primary lyrics/styles surface: sliders, vocal gender, and the
 * exclude-styles input.
 */
export default function MoreOptionsSection({
  weirdness,
  onWeirdnessChange,
  styleInfluence,
  onStyleInfluenceChange,
  vocalGender,
  onVocalGenderChange,
  negativeTags,
  onNegativeTagsChange,
  disabled,
}: Props) {
  return (
    <CollapsibleCard title="More options" defaultOpen={false}>
      <div className="space-y-5">
        <Slider
          label="Weirdness"
          value={weirdness}
          onChange={onWeirdnessChange}
          hint="Higher is more experimental, lower follows the formula."
          disabled={disabled}
        />
        <Slider
          label="Style influence"
          value={styleInfluence}
          onChange={onStyleInfluenceChange}
          hint="How closely to follow the style tags you set."
          disabled={disabled}
        />
        <VocalGenderChips
          value={vocalGender}
          onChange={onVocalGenderChange}
          disabled={disabled}
        />

        {/* Exclude styles — Suno keeps this inside More options */}
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-medium text-neutral-300">Exclude styles</span>
          <textarea
            value={negativeTags}
            onChange={(e) => onNegativeTagsChange(e.target.value.slice(0, NEGATIVE_MAX))}
            rows={2}
            disabled={disabled}
            placeholder="e.g. heavy metal, dubstep"
            className="scrollbar-thin w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-500 resize-none disabled:opacity-50 transition-colors"
          />
        </div>
      </div>
    </CollapsibleCard>
  );
}
