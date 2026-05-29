import { NextRequest } from "next/server";
import { sunoApi } from "@/lib/SunoApi";
import { corsJson, corsOptions, handleSunoError, requestCookie } from "@/lib/apiResponse";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audio_id } = body;

    if (!audio_id) {
      return corsJson({ error: 'Audio ID is required' }, 400);
    }

    const audioInfo = await (await sunoApi(await requestCookie())).generateStems(audio_id);

    return corsJson(audioInfo);
  } catch (error: any) {
    console.error('Error generating stems:', error);
    return handleSunoError(error);
  }
}

export async function OPTIONS() {
  return corsOptions();
}
