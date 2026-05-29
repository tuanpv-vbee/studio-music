/**
 * Canonical client-side song model.
 *
 * This is the single shape the frontend uses for a Suno clip/song, whether it
 * arrives from a fresh generation (the create flow) or from the workspace feed
 * (`/api/get`). The create flow historically called this a `Clip` and the
 * workspace called it a `Song`; both now resolve to this one type.
 *
 * It is intentionally a superset: create-flow consumers only read the subset of
 * fields available mid-generation (`id`, `status`, `audio_url`, …) while the
 * feed populates the richer fields (`created_at`, `duration`, counts, …).
 */
export type Song = {
  id: string;
  title?: string;
  audio_url?: string;
  video_url?: string;
  image_url?: string;
  image_large_url?: string;
  status: string;
  created_at?: string;
  model_name?: string;
  duration?: number;
  tags?: string;
  prompt?: string;
  gpt_description_prompt?: string;
  is_liked?: boolean;
  play_count?: number;
  upvote_count?: number;
  error_message?: string;
};

/**
 * Alias kept for the create flow, which refers to in-progress generations as
 * "clips" (Suno's own terminology). Structurally identical to {@link Song}.
 */
export type Clip = Song;
