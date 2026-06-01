import { NextRequest } from 'next/server';
import { sunoApi } from '@/lib/SunoApi';
import { corsJson, corsOptions, requestCookie } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const songIds = url.searchParams.get('ids');
    const page = url.searchParams.get('page');
    const search = url.searchParams.get('search');
    const cursor = url.searchParams.get('cursor');
    const cookie = await requestCookie();

    let audioInfo = [];
    if (songIds && songIds.length > 0) {
      // Specific clips by id (e.g. generation polling) — feed/v2.
      const idsArray = songIds.split(',');
      audioInfo = await (await sunoApi(cookie)).get(idsArray, page);
    } else if (page) {
      // Legacy page-based listing — feed/v2 (kept for API backward compat).
      audioInfo = await (await sunoApi(cookie)).get(undefined, page);
    } else {
      // Default workspace listing + search — feed/v3 (cursor-based).
      audioInfo = await (
        await sunoApi(cookie)
      ).getWorkspaceFeed(search ?? undefined, cursor);
    }

    return corsJson(audioInfo);
  } catch (error) {
    console.error('Error fetching audio:', error);
    return corsJson({ error: 'Internal server error' }, 500);
  }
}

export async function OPTIONS() {
  return corsOptions();
}
