import { NextRequest } from "next/server";
import { sunoApi } from "@/lib/SunoApi";
import { corsJson, corsOptions, requestCookie } from "@/lib/apiResponse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const song_id = url.searchParams.get('song_id');

    if (!song_id) {
      return corsJson({ error: 'Song ID is required' }, 400);
    }

    const lyricAlignment = await (await sunoApi(await requestCookie())).getLyricAlignment(song_id);

    return corsJson(lyricAlignment);
  } catch (error) {
    console.error('Error fetching lyric alignment:', error);
    return corsJson({ error: 'Internal server error. ' + error }, 500);
  }
}

export async function OPTIONS() {
  return corsOptions();
}
