'use client';

import { RefreshIcon } from '@/components/icons';

interface Props {
  count: number;
  loading: boolean;
  onRefresh: () => void;
}

export default function WorkspaceHeader({ count, loading, onRefresh }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-baseline gap-3">
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest">
          My Workspace
        </span>
        {count > 0 && (
          <span className="text-[10px] text-neutral-600 tabular-nums">
            {count} song{count > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        title="Refresh"
        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors disabled:opacity-40"
      >
        <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
