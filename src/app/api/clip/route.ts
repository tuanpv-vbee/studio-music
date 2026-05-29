import { NextRequest } from "next/server";
import { sunoApi } from "@/lib/SunoApi";
import { corsJson, corsOptions } from "@/lib/apiResponse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clipId = url.searchParams.get('id');
    if (clipId == null) {
      return corsJson({ error: 'Missing parameter id' }, 400);
    }

    const audioInfo = await (await sunoApi()).getClip(clipId);

    return corsJson(audioInfo);
  } catch (error) {
    console.error('Error fetching audio:', error);
    return corsJson({ error: 'Internal server error' }, 500);
  }
}

export async function OPTIONS() {
  return corsOptions();
}
