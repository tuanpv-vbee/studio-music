'use client';

import PlayerBar from '@/features/workspace/PlayerBar';
import { PlayerProvider } from '@/features/workspace/PlayerContext';
import SongDetail from '@/features/song/SongDetail';

export default function SongPage({ params }: { params: { id: string } }) {
  return (
    <PlayerProvider>
      <SongDetail id={params.id} />
      <PlayerBar />
    </PlayerProvider>
  );
}
