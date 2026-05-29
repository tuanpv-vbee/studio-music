export type GeneratePhase = 'idle' | 'submitting' | 'polling' | 'done';

export type VocalGender = 'off' | 'female' | 'male';

// A create-flow clip is structurally the canonical Song. Re-exported from the
// shared model so create-flow imports (`@/types/create`) keep working.
export type { Clip } from './song';
