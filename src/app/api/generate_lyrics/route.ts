import { NextRequest } from "next/server";
import { sunoApi } from "@/lib/SunoApi";
import { corsJson, corsOptions, handleSunoError, requestCookie } from "@/lib/apiResponse";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    const lyrics = await (await sunoApi(await requestCookie())).generateLyrics(prompt);

    return corsJson(lyrics);
  } catch (error: any) {
    console.error('Error generating lyrics:', error);
    return handleSunoError(error);
  }
}

export async function OPTIONS() {
  return corsOptions();
}
