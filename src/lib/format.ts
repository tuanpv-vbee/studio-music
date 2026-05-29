/**
 * Format a duration in seconds as `m:ss` (e.g. 65 → "1:05").
 * Returns "0:00" for non-finite or negative input.
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${sec}`;
}
