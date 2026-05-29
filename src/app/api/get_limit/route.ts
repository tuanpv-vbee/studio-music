import { NextRequest } from "next/server";
import { sunoApi } from "@/lib/SunoApi";
import { corsJson, corsOptions, requestCookie } from "@/lib/apiResponse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const limit = await (await sunoApi(await requestCookie())).get_credits();

    return corsJson(limit);
  } catch (error) {
    console.error('Error fetching limit:', error);
    return corsJson({ error: 'Internal server error. ' + error }, 500);
  }
}

export async function OPTIONS() {
  return corsOptions();
}
