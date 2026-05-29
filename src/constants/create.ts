// Create-flow constants — shared across Simple + Custom modes.

/** Statuses considered "done polling" by useGenerate. */
export const TERMINAL_STATUSES = new Set(['streaming', 'complete', 'error']);

/** Model dropdown options. PRO tags mark gated models for premium accounts. */
export const MODELS = [
  { value: '', label: 'Default (chirp-auk-turbo)' },
  { value: 'chirp-auk-turbo', label: 'chirp-auk-turbo' },
  { value: 'chirp-v3-5', label: 'chirp-v3-5' },
  { value: 'chirp-v3-0', label: 'chirp-v3-0' },
  { value: 'chirp-v4', label: 'chirp-v4 · PRO' },
  { value: 'chirp-auk', label: 'chirp-auk · v4.5 PRO' },
];

/** Simple-mode chip cloud — short curated list, append-only. */
export const SUGGESTION_TAGS = [
  'upbeat pop',
  'sad ballad',
  'lo-fi hip hop',
  'epic orchestral',
  'acoustic guitar',
  'heavy metal',
  'jazz piano',
  'tropical house',
  'dark ambient',
  'r&b soul',
];

/** Custom-mode style suggestions — wider palette, click-to-add (disappears once used). */
export const STYLE_SUGGESTIONS = [
  'slow heavy metal',
  'percusión',
  'mass choir',
  'torch-lounge',
  'bro country',
  'upbeat pop',
  'jazz piano',
  'lo-fi hip hop',
  'epic orchestral',
  'dark ambient',
  'r&b soul',
  'acoustic guitar',
  'tropical house',
  'indie folk',
  'deep house',
  'synthwave',
  'trap',
  'gospel',
  'bossa nova',
  'k-pop',
];

// Char limits — match Suno's enforced caps.
export const LYRICS_MAX = 3_000;
export const STYLE_MAX = 200;
export const TITLE_MAX = 100;
export const NEGATIVE_MAX = 200;
