import { NextRequest } from "next/server";
import { DEFAULT_MODEL, sunoApi } from "@/lib/SunoApi";
import { corsJson, corsOptions, handleSunoError, requestCookie } from "@/lib/apiResponse";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audio_id, prompt, continue_at, tags, negative_tags, title, model, wait_audio } = body;

    if (!audio_id) {
      return corsJson({ error: 'Audio ID is required' }, 400);
    }

    const audioInfo = await (await sunoApi(await requestCookie()))
      .extendAudio(audio_id, prompt, continue_at, tags || '', negative_tags || '', title, model || DEFAULT_MODEL, wait_audio || false);

    return corsJson(audioInfo);
  } catch (error: any) {
    console.error('Error extend audio:', error);
    return handleSunoError(error);
  }
}

export async function OPTIONS() {
  return corsOptions();
}
