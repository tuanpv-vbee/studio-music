import { NextRequest } from "next/server";
import { DEFAULT_MODEL, sunoApi } from "@/lib/SunoApi";
import { corsJson, corsOptions, requestCookie } from "@/lib/apiResponse";

export const maxDuration = 60; // allow longer timeout for wait_audio == true
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, tags, title, make_instrumental, model, wait_audio, negative_tags } = body;
    const audioInfo = await (await sunoApi(await requestCookie())).custom_generate(
      prompt, tags, title,
      Boolean(make_instrumental),
      model || DEFAULT_MODEL,
      Boolean(wait_audio),
      negative_tags
    );
    return corsJson(audioInfo);
  } catch (error: any) {
    console.error('Error generating custom audio:', error);
    return corsJson(
      { error: error.response?.data?.detail || error.toString() },
      error.response?.status || 500
    );
  }
}

export async function OPTIONS() {
  return corsOptions();
}
