'use client';

import { ReactNode, useState } from 'react';
import { ChevronIcon } from '@/components/icons';

interface Props {
  title: string;
  defaultOpen?: boolean;
  rightAction?: ReactNode;
  children: ReactNode;
}

/** Suno-style collapsible card: rounded, dark, header w/ chevron + optional action. */
export default function CollapsibleCard({ title, defaultOpen = true, rightAction, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-neutral-200 hover:text-white transition-colors"
        >
          <ChevronIcon
            className={`w-4 h-4 transition-transform ${open ? '' : '-rotate-90'}`}
          />
          {title}
        </button>
        {rightAction && <div className="flex items-center gap-1">{rightAction}</div>}
      </div>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}
