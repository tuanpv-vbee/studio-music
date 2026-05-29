import { NextRequest } from 'next/server';
import { sunoApi } from '@/lib/SunoApi';
import { corsJson, corsOptions, requestCookie } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const songIds = url.searchParams.get('ids');
    const page = url.searchParams.get('page');
    const cookie = await requestCookie();

    let audioInfo = [];
    if (songIds && songIds.length > 0) {
      const idsArray = songIds.split(',');
      audioInfo = await (await sunoApi(cookie)).get(idsArray, page);
    } else {
      audioInfo = await (await sunoApi(cookie)).get(undefined, page);
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
