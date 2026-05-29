import { NextResponse, NextRequest } from "next/server";
import { DEFAULT_MODEL, sunoApi } from "@/lib/SunoApi";
import { corsHeaders } from "@/lib/utils";
import { corsJson, corsOptions } from "@/lib/apiResponse";

export const dynamic = "force-dynamic";

/**
 * OpenAI chat-completions-shaped endpoint. Maps the last `user` message to a
 * generate() call and returns the result as Markdown.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let userMessage = null;
    const { messages } = body;
    for (let message of messages) {
      if (message.role == 'user') {
        userMessage = message;
      }
    }

    if (!userMessage) {
      return corsJson({ error: 'Prompt message is required' }, 400);
    }

    const audioInfo = await (await sunoApi()).generate(userMessage.content, true, DEFAULT_MODEL, true);

    const audio = audioInfo[0]
    const data = `## Song Title: ${audio.title}\n![Song Cover](${audio.image_url})\n### Lyrics:\n${audio.lyric}\n### Listen to the song: ${audio.audio_url}`

    return new NextResponse(data, {
      status: 200,
      headers: corsHeaders
    });
  } catch (error: any) {
    console.error('Error generating audio:', JSON.stringify(error.response.data));
    return corsJson({ error: 'Internal server error: ' + JSON.stringify(error.response.data.detail) }, 500);
  }
}

export async function OPTIONS() {
  return corsOptions();
}
