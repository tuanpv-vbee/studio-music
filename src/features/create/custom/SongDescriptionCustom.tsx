'use client';

import { useCreate } from '../CreateContext';
import CreateBar from './CreateBar';
import LyricsSection from './LyricsSection';
import MoreOptionsSection from './MoreOptionsSection';
import PersonaSection from './PersonaSection';
import StylesSection from './StylesSection';
import TitleSection from './TitleSection';

/**
 * Suno's "Advanced" create form. Matches the real /create page top→bottom:
 *   1. Lyrics card (Auto/Write toggle)
 *   2. Styles card (textarea + chips)
 *   3. Persona (collapsed)
 *   4. More options (collapsed) — weirdness, style influence, vocal, exclude
 *   5. Title card
 *   6. Sticky CreateBar — Instrumental · songs · model · Create N credits
 *
 * Pure presentational shell — all state lives in `useGenerate` via CreateContext.
 */
export default function SongDescriptionCustom() {
  const {
    lyrics, setLyrics: onLyricsChange,
    style, setStyle: onStyleChange,
    title, setTitle: onTitleChange,
    negativeTags, setNegativeTags: onNegativeTagsChange,
    instrumental, setInstrumental: onInstrumentalChange,
    model, setModel: onModelChange,
    personaId, setPersonaId: onPersonaIdChange,
    weirdness, setWeirdness: onWeirdnessChange,
    styleInfluence, setStyleInfluence: onStyleInfluenceChange,
    vocalGender, setVocalGender: onVocalGenderChange,
    songCount, setSongCount: onSongCountChange,
    phase, generate: onSubmit,
  } = useCreate();

  const busy = phase === 'submitting' || phase === 'polling';
  const canSubmit = !!(style.trim() || lyrics.trim() || title.trim());

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest">
          Advanced
        </span>
        <span className="text-[10px] text-neutral-600">
          Lyrics · Styles · Persona · Options
        </span>
      </div>

      <LyricsSection
        lyrics={lyrics}
        onLyricsChange={onLyricsChange}
        instrumental={instrumental}
        disabled={busy}
      />

      <StylesSection style={style} onStyleChange={onStyleChange} disabled={busy} />

      <PersonaSection
        personaId={personaId}
        onPersonaIdChange={onPersonaIdChange}
        disabled={busy}
      />

      <MoreOptionsSection
        weirdness={weirdness}
        onWeirdnessChange={onWeirdnessChange}
        styleInfluence={styleInfluence}
        onStyleInfluenceChange={onStyleInfluenceChange}
        vocalGender={vocalGender}
        onVocalGenderChange={onVocalGenderChange}
        negativeTags={negativeTags}
        onNegativeTagsChange={onNegativeTagsChange}
        disabled={busy}
      />

      <TitleSection title={title} onTitleChange={onTitleChange} disabled={busy} />

      <CreateBar
        instrumental={instrumental}
        onInstrumentalChange={onInstrumentalChange}
        songCount={songCount}
        onSongCountChange={onSongCountChange}
        model={model}
        onModelChange={onModelChange}
        onSubmit={onSubmit}
        canSubmit={canSubmit}
        phase={phase}
      />
    </div>
  );
}
