import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { corsHeaders } from './utils';

/**
 * JSON response with the standard CORS headers. `data` is JSON-stringified.
 */
export function corsJson(data: unknown, status = 200): NextResponse {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

/**
 * The CORS preflight response shared by every route's `OPTIONS` export.
 */
export function corsOptions(): Response {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Resolves the forwarded request cookie string used to look up a per-request
 * authenticated `SunoApi` instance.
 */
export async function requestCookie(): Promise<string> {
  return (await cookies()).toString();
}

/**
 * Shared error responder for the generation-style routes (generate, custom
 * extend, concat, stems, lyrics). Distinguishes axios errors with a response
 * (incl. 402 payment-required), network errors without a response, and other
 * errors, mirroring the original per-route handling.
 */
export function handleSunoError(error: any): NextResponse {
  if (error.response) {
    console.error('Response error:', JSON.stringify(error.response.data));

    if (error.response.status === 402) {
      return corsJson(
        { error: error.response.data?.detail || 'Payment required' },
        402
      );
    }

    return corsJson(
      {
        error:
          'API Error: ' +
          (error.response.data?.detail ||
            error.response.statusText ||
            'Unknown error')
      },
      error.response.status || 500
    );
  } else if (error.request) {
    console.error('Network error:', error.message);
    return corsJson(
      {
        error:
          'Network error: Unable to connect to Suno API. Please check your internet connection and try again.'
      },
      503
    );
  } else {
    console.error('Other error:', error.message);
    return corsJson(
      { error: 'Internal error: ' + (error.message || 'Unknown error occurred') },
      500
    );
  }
}
