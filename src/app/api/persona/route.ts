import { NextRequest } from "next/server";
import { sunoApi } from "@/lib/SunoApi";
import { corsJson, corsOptions } from "@/lib/apiResponse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const personaId = url.searchParams.get('id');
    const page = url.searchParams.get('page');

    if (personaId == null) {
      return corsJson({ error: 'Missing parameter id' }, 400);
    }

    const pageNumber = page ? parseInt(page) : 1;
    const personaInfo = await (await sunoApi()).getPersonaPaginated(personaId, pageNumber);

    return corsJson(personaInfo);
  } catch (error) {
    console.error('Error fetching persona:', error);
    return corsJson({ error: 'Internal server error' }, 500);
  }
}

export async function OPTIONS() {
  return corsOptions();
}
