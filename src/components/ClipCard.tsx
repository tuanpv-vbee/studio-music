import { Clip } from '@/types/create';
import StatusBadge from './StatusBadge';

export default function ClipCard({ clip }: { clip: Clip }) {
  const ready = !!clip.audio_url;
  return (
    <div className="border border-neutral-800 rounded-xl p-4 bg-neutral-950">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs opacity-60 font-mono">{clip.id.slice(0, 8)}</span>
        <StatusBadge status={clip.status} />
      </div>

      {clip.title && <div className="font-semibold mb-1">{clip.title}</div>}
      <div className="text-xs opacity-60 mb-3">model: {clip.model_name ?? '—'}</div>

      {ready ? (
        <audio src={clip.audio_url} controls preload="none" className="w-full" />
      ) : (
        <p className="text-sm opacity-70">
          {clip.status === 'error' ? `❌ ${clip.error_message ?? 'error'}` : '⏳ rendering…'}
        </p>
      )}

      {clip.video_url && (
        <a
          href={clip.video_url}
          target="_blank"
          rel="noreferrer"
          className="text-xs opacity-60 underline mt-2 inline-block"
        >
          download video
        </a>
      )}
    </div>
  );
}
