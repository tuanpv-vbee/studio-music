# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install deps
npm run dev        # start dev server (Next.js) on http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint (next lint)

docker compose build && docker compose up   # run via Docker
```

There is **no test suite** in this repo — no test runner, no test files. Verify changes by running `npm run dev` and hitting the API routes directly (e.g. `curl -X POST http://localhost:3000/api/generate -H 'Content-Type: application/json' -d '{"prompt":"a happy song","wait_audio":true}'`). Live API calls require a valid `SUNO_COOKIE` (and the `SUNO_DEVICE_ID` / `SUNO_USER_TIER` / `SUNO_CREATE_SESSION_TOKEN` web-client identifiers, see below) in `.env`.

## What this is

An unofficial REST wrapper around Suno's private music-generation API. There is no official Suno API; this project reverse-engineers Suno's internal endpoints (`studio-api-prod.suno.com`) and Clerk auth (`auth.suno.com`). It exposes clean endpoints meant to be used as a tool/plugin for LLM agents (GPTs, Coze), including an OpenAI-compatible route.

## Architecture

The system has two layers:

1. **`src/lib/SunoApi.ts`** — the entire integration. A single `SunoApi` class holds an authenticated `axios` client and implements every operation (generate, custom_generate, extend, concat, stems, lyrics, feed/get, credits, persona). This is where ~all real logic lives.
2. **`src/app/api/*/route.ts`** — thin Next.js App Router handlers. Each route parses the request body, calls the matching `SunoApi` method, applies `corsHeaders` from `src/lib/utils.ts`, and returns JSON. There is also `src/app/v1/chat/completions/route.ts`, an OpenAI chat-completions-shaped endpoint that maps the last `user` message to `generate(...)` and returns Markdown.

### Auth lifecycle (critical to understand)
`sunoApi(cookie?)` (bottom of `SunoApi.ts`) is the entry point every route uses. It:
- Resolves the cookie from the request `Cookie` header **or** falls back to `process.env.SUNO_COOKIE`. Routes forward `(await cookies()).toString()` so callers can supply per-request creds.
- **Caches** one initialized `SunoApi` instance per cookie string in a `global` map.
- `init()` → `getAuthToken()` (Clerk `/v1/client` → `last_active_session_id`) → `keepAlive()` (Clerk session `tokens` endpoint → JWT). The JWT is injected as `Bearer` on every request via an axios interceptor; another interceptor folds any `set-cookie` back into the cookie jar. Most public methods call `keepAlive()` first to refresh the short-lived token.

### Web client mimicry (the fragile part)
As of 2026-05 Suno's web client requires several anti-bot identifiers on every generate request:

- `device-id` header — a UUID. Wrapper sources it from `SUNO_DEVICE_ID` env, falling back to the `ajs_anonymous_id` cookie, then a random UUID.
- `browser-token` header — `{"token": "<base64({\"timestamp\": Date.now()})>"}`. Wrapper recomputes this on every request via an axios request interceptor (see `SunoApi.ts` constructor).
- `metadata.user_tier` and `metadata.create_session_token` in the `POST /api/generate/v2-web/` body — both are UUIDs. `user_tier` is per-account and stable; `create_session_token` is short-lived and currently must be supplied via env (`SUNO_USER_TIER`, `SUNO_CREATE_SESSION_TOKEN`). When generate starts returning `token_validation_failed` (HTTP 422), this token has expired and must be re-captured from the browser.
- `token` (body) — a **Cloudflare Turnstile** token, a `P1_...` string, paired with `token_provider: 1`. Sending `"token": null` yields HTTP 422 `token_validation_failed`. Supplied via env (`SUNO_TURNSTILE_TOKEN`); short-lived, re-capture from the browser when 422.

### Generate request paths (in `generateSongs`)
1. **Primary** — if `SUNO_TURNSTILE_TOKEN` **and** `SUNO_CREATE_SESSION_TOKEN` are set, POST directly to `/api/generate/v2-web/` with the real `token`/`token_provider`/`create_session_token`/`user_tier`. This replicates the captured web-client request; no browser needed.
2. **Fallback** — otherwise try legacy `/api/generate/v2/` (no token), then fall back to `generateViaBrowser()` (headless Playwright driving `suno.com/create`).

hCaptcha is no longer used (Suno replaced it with Turnstile). If the Turnstile flow changes again, the 2Captcha + Playwright captcha-solving code was deleted in an earlier refactor and would need reintroducing.

### Why this breaks
Hardcoded values that must be updated when Suno changes things: `SunoApi.CLERK_VERSION`, `BASE_URL` (`studio-api-prod.suno.com`), `CLERK_BASE_URL`, the `sec-ch-ua` header set, the generate endpoint path (`/api/generate/v2-web/`), and `DEFAULT_MODEL` (currently `chirp-auk-turbo`). Auth failures usually mean the cookie expired or the Clerk version/endpoint changed. `token_validation_failed` usually means `SUNO_CREATE_SESSION_TOKEN` has expired.

### Capturing the env values
1. Log into `suno.com/create` in a real browser.
2. DevTools → Network → filter `generate/v2-web`.
3. Create one song. Open the resulting `POST .../api/generate/v2-web/` request:
   - `SUNO_DEVICE_ID` = `device-id` request header.
   - `SUNO_USER_TIER` = `metadata.user_tier` from the JSON body.
   - `SUNO_CREATE_SESSION_TOKEN` = `metadata.create_session_token` from the JSON body.
   - `SUNO_TURNSTILE_TOKEN` = the top-level `token` (`P1_...`) from the JSON body.
4. Also re-copy `SUNO_COOKIE` from the same session (must contain `__client`).

## Environment variables

Set in `.env` (see `.env.example`).

- `SUNO_COOKIE` — full `Cookie` header from a logged-in `suno.com/create` request, must contain `__client`.
- `SUNO_DEVICE_ID` — `device-id` header value (UUID). Optional but recommended; falls back to cookie's `ajs_anonymous_id`.
- `SUNO_USER_TIER` — `metadata.user_tier` UUID from a generate request body.
- `SUNO_CREATE_SESSION_TOKEN` — `metadata.create_session_token` UUID from a generate request body. Short-lived; refresh when 422.
- `SUNO_TURNSTILE_TOKEN` — top-level `token` (`P1_...` Cloudflare Turnstile string) from a generate request body. Sent with `token_provider: 1`. Short-lived; refresh when 422. With this + `SUNO_CREATE_SESSION_TOKEN` set, generate skips the headless browser.

## Conventions

- API routes use `export const dynamic = "force-dynamic"` and export `OPTIONS` returning `corsHeaders` for browser CORS.
- Logging is via `pino` in the lib; routes use `console.error`. Long-poll helpers (`wait_audio`, lyrics polling) live inside `SunoApi` and use the `sleep(x, y)` jitter helper from `src/lib/utils.ts`.
- Generate errors log the full Suno response via `pino` (`status` + `suno` + `headers`) for diagnosis.
- Path alias `@/` maps to `src/` (see `tsconfig.json`).
- Endpoint reference (method ↔ route): `/api/generate`, `/api/custom_generate`, `/api/extend_audio`, `/api/concat`, `/api/generate_stems`, `/api/generate_lyrics`, `/api/get`, `/api/get_aligned_lyrics`, `/api/get_limit`, `/api/clip`, `/api/persona`, and `/v1/chat/completions`. Swagger docs at `/docs`.
