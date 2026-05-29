import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * Proxies a Suno CDN audio/video URL with `Content-Disposition: attachment`
 * so the browser triggers a real download instead of navigating to the file.
 *
 * The `download` attribute on <a> only works for same-origin URLs (the spec
 * silently ignores it cross-origin). Routing through this endpoint side-steps
 * that limitation.
 *
 * Query params:
 *   url       — required, must be a Suno CDN URL
 *   filename  — optional, sanitized; defaults to 'song.mp3'
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  const rawName = searchParams.get('filename') || 'song.mp3';

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400, headers: corsHeaders });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400, headers: corsHeaders });
  }

  // Allow-list: only Suno-owned hostnames. Prevents this endpoint from
  // becoming an open SSRF proxy.
  if (!/(^|\.)(suno\.ai|suno\.com)$/.test(target.hostname)) {
    return NextResponse.json(
      { error: 'URL not allowed' },
      { status: 400, headers: corsHeaders },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString());
  } catch (e: any) {
    return NextResponse.json(
      { error: `Fetch failed: ${e?.message ?? 'unknown'}` },
      { status: 502, headers: corsHeaders },
    );
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: `Upstream ${upstream.status}` },
      { status: 502, headers: corsHeaders },
    );
  }

  // Sanitize filename and ensure an extension matching the content-type.
  const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
  const ext = guessExt(contentType, rawName);
  const safeBase = rawName
    .replace(/\.[^.]+$/, '')
    .replace(/[^\w\-]+/g, '_')
    .slice(0, 80) || 'song';
  const safeName = `${safeBase}.${ext}`;

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${safeName}"`,
    'Cache-Control': 'no-store',
    ...corsHeaders,
  };
  const len = upstream.headers.get('content-length');
  if (len) headers['Content-Length'] = len;

  return new NextResponse(upstream.body, { status: 200, headers });
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

function guessExt(contentType: string, filename: string): string {
  const fromName = filename.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase();
  if (fromName) return fromName;
  if (contentType.includes('mpeg')) return 'mp3';
  if (contentType.includes('mp4')) return 'mp4';
  if (contentType.includes('wav')) return 'wav';
  if (contentType.includes('webm')) return 'webm';
  return 'mp3';
}
