/**
 * Bouncing EQ-bars "now playing" indicator — overlay on song covers.
 * Pure CSS animation (see `.eq-bar` keyframes in globals.css). Each bar
 * uses an inline `animationDelay` / `animationDuration` to create the
 * wave effect rather than synced bouncing.
 */
interface Props {
  className?: string;
  /** Number of bars; default 4 (Suno style). */
  count?: number;
  /** Tailwind background util for bars; default white. */
  barClassName?: string;
}

// Hand-tuned cascade — feels organic and matches Suno's cover overlay.
const PATTERN: Array<{ delay: number; duration: number }> = [
  { delay: 0.0, duration: 0.9 },
  { delay: 0.2, duration: 1.1 },
  { delay: 0.5, duration: 0.8 },
  { delay: 0.1, duration: 1.0 },
  { delay: 0.4, duration: 1.2 },
];

export default function EqualizerBars({
  className = '',
  count = 4,
  barClassName = 'bg-white',
}: Props) {
  return (
    <div
      className={['flex items-end gap-[2px] h-4', className].join(' ')}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => {
        const p = PATTERN[i % PATTERN.length];
        return (
          <span
            key={i}
            className={['eq-bar w-[3px] h-full rounded-sm', barClassName].join(' ')}
            style={{
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        );
      })}
    </div>
  );
}
