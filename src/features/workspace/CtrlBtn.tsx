import type { ReactNode } from 'react';

/** Unified small icon-button used across all 3 clusters of the player bar. */
export default function CtrlBtn({
  children,
  label,
  onClick,
  active = false,
  disabled = false,
  activeColor = 'text-white',
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  activeColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={[
        'p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed',
        active
          ? `${activeColor} bg-neutral-800`
          : 'text-neutral-400 hover:text-white hover:bg-neutral-800',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
