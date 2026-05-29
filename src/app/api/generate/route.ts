import { NextRequest } from "next/server";
import { DEFAULT_MODEL, sunoApi } from "@/lib/SunoApi";
import { corsJson, corsOptions, handleSunoError, requestCookie } from "@/lib/apiResponse";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, make_instrumental, model, wait_audio } = body;

    const audioInfo = await (await sunoApi(await requestCookie())).generate(
      prompt,
      Boolean(make_instrumental),
      model || DEFAULT_MODEL,
      Boolean(wait_audio)
    );

    return corsJson(audioInfo);
  } catch (error: any) {
    console.error('Error generating audio:', error);
    return handleSunoError(error);
  }
}

export async function OPTIONS() {
  return corsOptions();
}
