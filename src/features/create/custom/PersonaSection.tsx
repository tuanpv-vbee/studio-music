'use client';

import CollapsibleCard from './CollapsibleCard';

interface Props {
  personaId: string;
  onPersonaIdChange: (v: string) => void;
  disabled?: boolean;
}

export default function PersonaSection({ personaId, onPersonaIdChange, disabled }: Props) {
  return (
    <CollapsibleCard title="Persona" defaultOpen={false}>
      <p className="text-xs text-neutral-500 mb-2 leading-relaxed">
        Paste a <code className="text-neutral-300">persona_id</code> from a saved song/voice to reuse
        its style & vocals.
      </p>
      <input
        value={personaId}
        onChange={(e) => onPersonaIdChange(e.target.value.trim())}
        disabled={disabled}
        placeholder="Persona UUID (e.g. 8f1a…)"
        className="w-full bg-neutral-950/60 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-neutral-600 disabled:opacity-50 font-mono"
      />
    </CollapsibleCard>
  );
}
