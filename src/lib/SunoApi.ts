import axios, { AxiosInstance } from 'axios';
import pino from 'pino';
import { sleep } from '@/lib/utils';
import * as cookie from 'cookie';
import { randomUUID } from 'node:crypto';

// sunoApi instance caching
const globalForSunoApi = global as unknown as {
  sunoApiCache?: Map<string, SunoApi>;
};
const cache = globalForSunoApi.sunoApiCache || new Map<string, SunoApi>();
globalForSunoApi.sunoApiCache = cache;

const logger = pino();
// `chirp-auk-turbo` is the free-tier "fast auk" variant Suno is currently
// rolling out (gated by the `auk-go-live` flag in /api/session/). It is not
// listed in `models[]`, but generate accepts it and the resulting clips are
// rendered as `chirp-auk` (v4.5) quality. Fallback to `chirp-v3-5` if Suno
// pulls the rollout.
export const DEFAULT_MODEL = 'chirp-auk-turbo';

export interface AudioInfo {
  id: string; // Unique identifier for the audio
  title?: string; // Title of the audio
  image_url?: string; // URL of the image associated with the audio
  lyric?: string; // Lyrics of the audio
  audio_url?: string; // URL of the audio file
  video_url?: string; // URL of the video associated with the audio
  created_at: string; // Date and time when the audio was created
  model_name: string; // Name of the model used for audio generation
  gpt_description_prompt?: string; // Prompt for GPT description
  prompt?: string; // Prompt for audio generation
  status: string; // Status
  type?: string;
  tags?: string; // Genre of music.
  negative_tags?: string; // Negative tags of music.
  duration?: string; // Duration of the audio
  error_message?: string; // Error message if any
  image_large_url?: string; // URL of the large cover image
  play_count?: number; // Number of plays
  upvote_count?: number; // Number of upvotes
  is_liked?: boolean; // Whether the current user liked the clip
}

interface PersonaResponse {
  persona: {
    id: string;
    name: string;
    description: string;
    image_s3_id: string;
    root_clip_id: string;
    clip: any; // You can define a more specific type if needed
    user_display_name: string;
    user_handle: string;
    user_image_url: string;
    persona_clips: Array<{
      clip: any; // You can define a more specific type if needed
    }>;
    is_suno_persona: boolean;
    is_trashed: boolean;
    is_owned: boolean;
    is_public: boolean;
    is_public_approved: boolean;
    is_loved: boolean;
    upvote_count: number;
    clip_count: number;
  };
  total_results: number;
  current_page: number;
  is_following: boolean;
}

class SunoApi {
  private static BASE_URL: string = 'https://studio-api-prod.suno.com';
  private static CLERK_BASE_URL: string = 'https://auth.suno.com';
  private static CLERK_VERSION = '5.117.0';

  private readonly client: AxiosInstance;
  private sid?: string;
  private currentToken?: string;
  private deviceId?: string;
  private userAgent?: string;
  private cookies: Record<string, string | undefined>;

  // Hard-coded to match the `sec-ch-ua` Client Hint below. Random UAs from the
  // `user-agents` library drift behind real Chrome (often v130), which Suno's
  // anti-bot rejects as inconsistent Client Hints → `token_validation_failed`.
  private static USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36';

  constructor(cookies: string) {
    this.userAgent = SunoApi.USER_AGENT;
    this.cookies = cookie.parse(cookies);
    this.deviceId =
      process.env.SUNO_DEVICE_ID ||
      this.cookies.ajs_anonymous_id ||
      randomUUID();
    this.client = axios.create({
      withCredentials: true,
      headers: {
        'Affiliate-Id': 'undefined',
        'device-id': this.deviceId,
        'sec-ch-ua':
          '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        origin: 'https://suno.com',
        referer: 'https://suno.com/',
        'User-Agent': this.userAgent
      }
    });
    this.client.interceptors.request.use((config) => {
      if (this.currentToken && !config.headers.Authorization)
        config.headers.Authorization = `Bearer ${this.currentToken}`;
      // browser-token: base64({"timestamp": Date.now()}) — Suno anti-bot header (2026-05)
      const innerToken = Buffer.from(
        JSON.stringify({ timestamp: Date.now() })
      ).toString('base64');
      config.headers['browser-token'] = JSON.stringify({ token: innerToken });
      const cookiesArray = Object.entries(this.cookies).map(([key, value]) =>
        cookie.serialize(key, value as string)
      );
      config.headers.Cookie = cookiesArray.join('; ');
      return config;
    });
    this.client.interceptors.response.use((resp) => {
      const setCookieHeader = resp.headers['set-cookie'];
      if (Array.isArray(setCookieHeader)) {
        // Each Set-Cookie is `name=value; attr1=...; attr2=...`. Only the FIRST
        // pair is the cookie; the rest are attributes (Expires/Max-Age/Path/
        // SameSite/Domain) that must NOT be folded into the cookie jar.
        const reserved = new Set([
          'expires',
          'max-age',
          'path',
          'domain',
          'samesite',
          'secure',
          'httponly',
          'priority',
          'partitioned'
        ]);
        for (const raw of setCookieHeader) {
          const first = raw.split(';', 1)[0];
          const eq = first.indexOf('=');
          if (eq <= 0) continue;
          const name = first.slice(0, eq).trim();
          const value = first.slice(eq + 1).trim();
          if (reserved.has(name.toLowerCase())) continue;
          this.cookies[name] = value;
        }
      }
      return resp;
    });
  }

  public async init(): Promise<SunoApi> {
    //await this.getClerkLatestVersion();
    await this.getAuthToken();
    await this.keepAlive();
    return this;
  }

  /**
   * Get the clerk package latest version id.
   * This method is commented because we are now using a hard-coded Clerk version, hence this method is not needed.
   
  private async getClerkLatestVersion() {
    // URL to get clerk version ID
    const getClerkVersionUrl = `${SunoApi.JSDELIVR_BASE_URL}/v1/package/npm/@clerk/clerk-js`;
    // Get clerk version ID
    const versionListResponse = await this.client.get(getClerkVersionUrl);
    if (!versionListResponse?.data?.['tags']['latest']) {
      throw new Error(
        'Failed to get clerk version info, Please try again later'
      );
    }
    // Save clerk version ID for auth
    SunoApi.clerkVersion = versionListResponse?.data?.['tags']['latest'];
  }
  */

  /**
   * Get the session ID and save it for later use.
   */
  private async getAuthToken() {
    logger.info('Getting the session ID');
    // URL to get session ID
    const getSessionUrl = `${SunoApi.CLERK_BASE_URL}/v1/client?__clerk_api_version=2025-11-10&_clerk_js_version=${SunoApi.CLERK_VERSION}`;
    // Get session ID
    const sessionResponse = await this.client.get(getSessionUrl, {
      headers: { Authorization: this.cookies.__client }
    });
    if (!sessionResponse?.data?.response?.last_active_session_id) {
      throw new Error(
        'Failed to get session id, you may need to update the SUNO_COOKIE'
      );
    }
    // Save session ID for later use
    this.sid = sessionResponse.data.response.last_active_session_id;
  }

  /**
   * Keep the session alive.
   * @param isWait Indicates if the method should wait for the session to be fully renewed before returning.
   */
  public async keepAlive(isWait?: boolean): Promise<void> {
    if (!this.sid) {
      throw new Error('Session ID is not set. Cannot renew token.');
    }
    // URL to renew session token
    const renewUrl = `${SunoApi.CLERK_BASE_URL}/v1/client/sessions/${this.sid}/tokens?__clerk_api_version=2025-11-10&_clerk_js_version=${SunoApi.CLERK_VERSION}`;
    // Renew session token
    logger.info('KeepAlive...\n');
    const renewResponse = await this.client.post(
      renewUrl,
      {},
      {
        headers: { Authorization: this.cookies.__client }
      }
    );
    if (isWait) {
      await sleep(1, 2);
    }
    const newToken = renewResponse.data.jwt;
    // Update Authorization field in request header with the new JWT token
    this.currentToken = newToken;
  }

  /**
   * UI-driven generation: opens suno.com/create in a real browser, fills the
   * create form, clicks the Create button, and intercepts the response of
   * /api/generate/v2-web/ that Suno's own React app issues.
   *
   * Branches on `payload.metadata.create_mode`:
   *  - 'simple' → fills the "Song Description" textarea (gpt_description_prompt).
   *  - 'custom' → switches to the Custom tab and fills Lyrics (`prompt`),
   *    Styles (`tags`) and Title (`title`). Crucially the lyrics go into the
   *    dedicated lyrics field; typing them into the Simple description box makes
   *    Suno invent a different song instead of singing them.
   *
   * Why drive the UI at all: programmatic fetch() calls — even from inside a
   * Playwright page — still fail with token_validation_failed. Suno's anti-bot
   * looks for additional client-side state (mouse trail, focus, React form
   * state, a HMAC we don't see). The only reliable path is to let Suno's own
   * JavaScript build and send the request and we just sniff the response.
   */
  private async generateViaBrowser(payload: any): Promise<any> {
    // Playwright/Chromium can't run on Vercel (and similar serverless) — fail
    // with a clear message instead of an opaque "browser not found" crash.
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      throw new Error(
        'Browser-driven generate is unavailable on serverless (Vercel). ' +
          'Set SUNO_TURNSTILE_TOKEN + SUNO_CREATE_SESSION_TOKEN to use the direct API path.'
      );
    }
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    const debugDir = '/tmp/suno-debug';
    let page: any;
    try {
      const context = await browser.newContext({
        userAgent: SunoApi.USER_AGENT,
        viewport: { width: 1440, height: 900 }
      });

      const cookiesList = Object.entries(this.cookies)
        .filter((pair): pair is [string, string] => pair[1] !== undefined)
        .map(([name, value]) => ({
          name,
          value,
          domain: '.suno.com',
          path: '/',
          sameSite: 'Lax' as const
        }));
      await context.addCookies(cookiesList);

      page = await context.newPage();
      await page.goto('https://suno.com/create', {
        waitUntil: 'domcontentloaded',
        timeout: 30_000
      });
      logger.info('Loaded suno.com/create');

      const isCustom = payload?.metadata?.create_mode === 'custom';
      // The field used for the post-typing diagnostics / "never enabled" message.
      let primaryField: any;

      if (isCustom) {
        // --- Custom mode: drive Lyrics + Styles + Title. ---
        // Feeding lyrics into the Simple "Song Description" box makes Suno treat
        // them as a *description* and invent a different song, so switch to the
        // Custom form and fill the real fields instead.
        const customTab = page
          .getByRole('button', { name: /^custom$/i })
          .first();
        if (await customTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await customTab.click().catch(() => {});
          logger.info('Clicked Custom mode tab');
        }

        const lyrics = String(payload?.prompt ?? '');
        const styles = String(payload?.tags ?? '');
        const title = String(payload?.title ?? '');

        // Lyrics → the dedicated lyrics textarea (data-testid="lyrics-textarea").
        if (lyrics.trim()) {
          const lyricsBox = page
            .locator('textarea[data-testid="lyrics-textarea"]')
            .first();
          await lyricsBox.waitFor({ state: 'visible', timeout: 15_000 });
          await lyricsBox.click();
          // pressSequentially fires React onChange; .fill() leaves Create disabled.
          await lyricsBox.pressSequentially(lyrics, { delay: 5 });
          const got = await lyricsBox.inputValue().catch(() => '');
          if (got.trim().length === 0) {
            throw new Error(
              'Lyrics did not register in the Custom lyrics textarea — Suno UI may have changed.'
            );
          }
          primaryField = lyricsBox;
        }

        // Styles → the maxlength=1000 textarea.
        const stylesBox = page
          .locator('textarea[maxlength="1000"]:visible')
          .first();
        if (
          styles.trim() &&
          (await stylesBox.isVisible({ timeout: 5_000 }).catch(() => false))
        ) {
          await stylesBox.click();
          await stylesBox.pressSequentially(styles, { delay: 10 });
          primaryField = primaryField ?? stylesBox;
        }

        // Title → best-effort (optional). Suno's title is a plain <input>.
        if (title.trim()) {
          const titleBox = page
            .locator('input[placeholder*="title" i]')
            .first();
          if (await titleBox.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await titleBox.click();
            await titleBox.pressSequentially(title, { delay: 10 });
          }
        }

        if (!primaryField) {
          throw new Error(
            'Custom generate needs lyrics or styles, but neither was provided.'
          );
        }
      } else {
        // --- Simple mode: the visible "Song Description" textarea. ---
        const simpleTab = page
          .getByRole('button', { name: /^simple$/i })
          .first();
        if (await simpleTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await simpleTab.click().catch(() => {});
          logger.info('Clicked Simple mode tab');
        }

        // Song Description is the visible maxlength=3000 textarea. The page also
        // renders (sometimes hidden) textareas for lyrics (maxlength 5000),
        // styles (maxlength 1000) and an advanced "Describe the sound you want"
        // field (maxlength 500); target the 3000 one so the prompt lands right.
        let textarea = page
          .locator('textarea[maxlength="3000"]:visible')
          .first();
        if (!(await textarea.isVisible({ timeout: 5_000 }).catch(() => false))) {
          textarea = page
            .locator(
              'textarea:visible:not([data-testid="lyrics-textarea"]):not([maxlength="1000"])'
            )
            .first();
          await textarea.waitFor({ state: 'visible', timeout: 15_000 });
        }

        const promptText =
          payload?.gpt_description_prompt || payload?.prompt || '';
        if (!promptText) {
          throw new Error(
            'No prompt text in payload (gpt_description_prompt/prompt empty)'
          );
        }
        logger.info(
          { prompt: promptText.slice(0, 80) },
          'Typing prompt into Suno UI'
        );
        await textarea.click();
        // pressSequentially (not fill) — Suno's React onChange/onInput only fire
        // on real keyboard input; .fill() leaves the Create button disabled.
        await textarea.pressSequentially(promptText, { delay: 20 });

        // Verify the value landed; otherwise Create never enables and a blind
        // click would time out opaquely.
        const typedValue = await textarea.inputValue().catch(() => '');
        if (typedValue.trim() !== promptText.trim()) {
          throw new Error(
            `Prompt did not register in the Song Description field (got ${JSON.stringify(
              typedValue.slice(0, 80)
            )}). Suno's create UI likely changed — re-check the textarea selector.`
          );
        }
        primaryField = textarea;
      }

      if (payload?.make_instrumental) {
        const instrumental = page
          .getByRole('switch', { name: /instrumental/i })
          .first();
        if (
          await instrumental.isVisible({ timeout: 2_000 }).catch(() => false)
        ) {
          await instrumental.click().catch(() => {});
        }
      }

      const genResponsePromise = page.waitForResponse(
        (r: any) =>
          r.url().includes('/api/generate/v2-web/') &&
          r.request().method() === 'POST',
        { timeout: 45_000 }
      );

      // The Create button has aria-label="Create song" (verified from DOM snapshot).
      const createBtn = page
        .locator('button[aria-label="Create song"]')
        .first();
      await createBtn.waitFor({ state: 'visible', timeout: 10_000 });
      // Wait until it becomes enabled (Suno disables it until the form is valid).
      // Don't swallow this: if it never enables, a blind .click() just blocks for
      // the full action timeout and throws an opaque "Timeout exceeded" error.
      const becameEnabled = await page
        .waitForFunction(
          () => {
            const b = document.querySelector(
              'button[aria-label="Create song"]'
            ) as HTMLButtonElement | null;
            return !!b && !b.disabled;
          },
          { timeout: 15_000 }
        )
        .then(() => true)
        .catch(() => false);
      if (!becameEnabled) {
        const val = await primaryField.inputValue().catch(() => '');
        throw new Error(
          `Create button never became enabled (primary field = ${JSON.stringify(
            val.slice(0, 80)
          )}). The form is still invalid — Suno may require additional fields or the UI changed.`
        );
      }
      logger.info('Clicking Create button...');
      await createBtn.click();

      const genResponse = await genResponsePromise;
      const status = genResponse.status();
      const text = await genResponse.text();
      if (status < 200 || status >= 300) {
        logger.error(
          { status, body: text.slice(0, 500) },
          'Suno UI generate response not OK'
        );
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = { raw: text };
        }
        const detail =
          parsed?.detail ?? parsed?.error ?? JSON.stringify(parsed);
        throw new Error(`generate failed (${status}): ${detail}`);
      }
      logger.info('generate/v2-web/ succeeded (UI-driven)');
      return JSON.parse(text);
    } catch (err) {
      // Save a screenshot + DOM snapshot to help debugging headless UI mismatches
      if (page) {
        try {
          const fs = await import('node:fs/promises');
          await fs.mkdir(debugDir, { recursive: true });
          const ts = Date.now();
          await page.screenshot({
            path: `${debugDir}/page-${ts}.png`,
            fullPage: true
          });
          const html = await page.content();
          await fs.writeFile(`${debugDir}/page-${ts}.html`, html);
          logger.error({ debugDir, ts }, 'Saved debug screenshot + HTML');
        } catch (snapErr) {
          logger.error(
            { err: String(snapErr) },
            'Failed to save debug snapshot'
          );
        }
      }
      throw err;
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate a song based on the prompt.
   * @param prompt The text prompt to generate audio from.
   * @param make_instrumental Indicates if the generated audio should be instrumental.
   * @param wait_audio Indicates if the method should wait for the audio file to be fully generated before returning.
   * @returns
   */
  public async generate(
    prompt: string,
    make_instrumental: boolean = false,
    model?: string,
    wait_audio: boolean = false
  ): Promise<AudioInfo[]> {
    await this.keepAlive(false);
    const startTime = Date.now();
    const audios = await this.generateSongs(
      prompt,
      false,
      undefined,
      undefined,
      make_instrumental,
      model,
      wait_audio
    );
    const costTime = Date.now() - startTime;
    logger.info('Generate Response:\n' + JSON.stringify(audios, null, 2));
    logger.info('Cost time: ' + costTime);
    return audios;
  }

  /**
   * Calls the concatenate endpoint for a clip to generate the whole song.
   * @param clip_id The ID of the audio clip to concatenate.
   * @returns A promise that resolves to an AudioInfo object representing the concatenated audio.
   * @throws Error if the response status is not 200.
   */
  public async concatenate(clip_id: string): Promise<AudioInfo> {
    await this.keepAlive(false);
    const payload: any = { clip_id: clip_id };

    const response = await this.client.post(
      `${SunoApi.BASE_URL}/api/generate/concat/v2/`,
      payload,
      {
        timeout: 10000 // 10 seconds timeout
      }
    );
    if (response.status !== 200) {
      throw new Error('Error response:' + response.statusText);
    }
    return response.data;
  }

  /**
   * Generates custom audio based on provided parameters.
   *
   * @param prompt The text prompt to generate audio from.
   * @param tags Tags to categorize the generated audio.
   * @param title The title for the generated audio.
   * @param make_instrumental Indicates if the generated audio should be instrumental.
   * @param wait_audio Indicates if the method should wait for the audio file to be fully generated before returning.
   * @param negative_tags Negative tags that should not be included in the generated audio.
   * @returns A promise that resolves to an array of AudioInfo objects representing the generated audios.
   */
  public async custom_generate(
    prompt: string,
    tags: string,
    title: string,
    make_instrumental: boolean = false,
    model?: string,
    wait_audio: boolean = false,
    negative_tags?: string
  ): Promise<AudioInfo[]> {
    const startTime = Date.now();
    const audios = await this.generateSongs(
      prompt,
      true,
      tags,
      title,
      make_instrumental,
      model,
      wait_audio,
      negative_tags
    );
    const costTime = Date.now() - startTime;
    logger.info(
      'Custom Generate Response:\n' + JSON.stringify(audios, null, 2)
    );
    logger.info('Cost time: ' + costTime);
    return audios;
  }

  /**
   * Generates songs based on the provided parameters.
   *
   * @param prompt The text prompt to generate songs from.
   * @param isCustom Indicates if the generation should consider custom parameters like tags and title.
   * @param tags Optional tags to categorize the song, used only if isCustom is true.
   * @param title Optional title for the song, used only if isCustom is true.
   * @param make_instrumental Indicates if the generated song should be instrumental.
   * @param wait_audio Indicates if the method should wait for the audio file to be fully generated before returning.
   * @param negative_tags Negative tags that should not be included in the generated audio.
   * @param task Optional indication of what to do. Enter 'extend' if extending an audio, otherwise specify null.
   * @param continue_clip_id
   * @returns A promise that resolves to an array of AudioInfo objects representing the generated songs.
   */
  private async generateSongs(
    prompt: string,
    isCustom: boolean,
    tags?: string,
    title?: string,
    make_instrumental?: boolean,
    model?: string,
    wait_audio: boolean = false,
    negative_tags?: string,
    task?: string,
    continue_clip_id?: string,
    continue_at?: number
  ): Promise<AudioInfo[]> {
    await this.keepAlive();
    // token (Turnstile P1_...) + token_provider + create_session_token are
    // injected below from env (primary path) or by generateViaBrowser().
    const payload: any = {
      token: null,
      generation_type: 'TEXT',
      mv: model || DEFAULT_MODEL,
      prompt: '',
      gpt_description_prompt: '',
      make_instrumental: make_instrumental,
      user_uploaded_images_b64: null,
      metadata: {
        web_client_pathname: '/create',
        is_max_mode: false,
        create_mode: isCustom ? 'custom' : 'simple',
        // user_tier + create_session_token set below (env override) or inside browser
        disable_volume_normalization: false,
        lyrics_model: 'default'
      },
      override_fields: [],
      cover_clip_id: null,
      cover_start_s: null,
      cover_end_s: null,
      persona_id: null,
      artist_clip_id: null,
      artist_start_s: null,
      artist_end_s: null,
      continue_clip_id: continue_clip_id ?? null,
      continued_aligned_prompt: null,
      continue_at: continue_at ?? null,
      transaction_uuid: randomUUID(),
      token_provider: null
    };
    if (task) payload.task = task;
    if (isCustom) {
      payload.tags = tags;
      payload.title = title;
      payload.negative_tags = negative_tags;
      payload.prompt = prompt;
    } else {
      payload.gpt_description_prompt = prompt;
    }
    logger.info(
      'generateSongs payload:\n' +
        JSON.stringify(
          {
            prompt: prompt,
            isCustom: isCustom,
            tags: tags,
            title: title,
            make_instrumental: make_instrumental,
            wait_audio: wait_audio,
            negative_tags: negative_tags,
            payload: payload
          },
          null,
          2
        )
    );
    let responseData: any;

    const turnstileToken = process.env.SUNO_TURNSTILE_TOKEN;
    const sessionToken = process.env.SUNO_CREATE_SESSION_TOKEN;

    if (turnstileToken && sessionToken) {
      // --- Primary path: replicate the real web-client request. ---
      // Suno's generate endpoint requires a Cloudflare Turnstile token (a
      // `P1_...` string) in `token`, paired with `token_provider: 1`. Sending
      // `token: null` yields HTTP 422 token_validation_failed. Both this token
      // and create_session_token are short-lived and captured from the browser.
      payload.token = turnstileToken;
      payload.token_provider = 1;
      payload.metadata.create_session_token = sessionToken;
      if (process.env.SUNO_USER_TIER) {
        payload.metadata.user_tier = process.env.SUNO_USER_TIER;
      }
      try {
        const r = await this.client.post(
          `${SunoApi.BASE_URL}/api/generate/v2-web/`,
          payload,
          { timeout: 15_000 }
        );
        responseData = r.data;
        logger.info('generate/v2-web/ succeeded (Turnstile token)');
      } catch (err: any) {
        const d = err?.response?.data;
        const status = err?.response?.status;
        logger.error(
          { status, suno: d, headers: err?.response?.headers },
          'generate/v2-web/ failed'
        );
        const detail = d?.detail ?? d?.error ?? JSON.stringify(d);
        const hint =
          status === 422
            ? ' — token_validation_failed: refresh SUNO_TURNSTILE_TOKEN and SUNO_CREATE_SESSION_TOKEN from the browser (the P1_ token is short-lived)'
            : '';
        throw new Error(`generate failed (${status}): ${detail}${hint}`);
      }
    } else {
      // --- Fallback: v2/ legacy endpoint (no token required) ---
      // Used when no Turnstile token is configured. If Suno still accepts it we
      // avoid all browser overhead; otherwise fall back to the browser.
      try {
        const legacyPayload: any = {
          make_instrumental: make_instrumental,
          mv: model || DEFAULT_MODEL,
          generation_type: 'TEXT',
          token: null,
          continue_at: continue_at ?? null,
          continue_clip_id: continue_clip_id ?? null
        };
        if (task) legacyPayload.task = task;
        if (isCustom) {
          legacyPayload.prompt = prompt;
          legacyPayload.tags = tags;
          legacyPayload.title = title;
          legacyPayload.negative_tags = negative_tags;
        } else {
          legacyPayload.prompt = '';
          legacyPayload.gpt_description_prompt = prompt;
        }
        const r = await this.client.post(
          `${SunoApi.BASE_URL}/api/generate/v2/`,
          legacyPayload,
          { timeout: 10_000 }
        );
        responseData = r.data;
        logger.info('generate/v2/ succeeded');
      } catch (legacyErr: any) {
        const legacyStatus = legacyErr?.response?.status;
        const legacyBody = legacyErr?.response?.data;
        logger.warn(
          { status: legacyStatus, body: legacyBody },
          'generate/v2/ failed, falling back to browser'
        );
        // Browser-assisted: let Suno's own JS build and send the request.
        try {
          responseData = await this.generateViaBrowser(payload);
        } catch (err: any) {
          const raw = String(err);
          logger.error({ error: raw }, 'generateViaBrowser failed');
          throw new Error(raw);
        }
      }
    }
    const songIds = responseData.clips.map((audio: any) => audio.id);
    //Want to wait for music file generation
    if (wait_audio) {
      const startTime = Date.now();
      let lastResponse: AudioInfo[] = [];
      await sleep(5, 5);
      while (Date.now() - startTime < 100000) {
        const response = await this.get(songIds);
        const allCompleted = response.every(
          (audio) => audio.status === 'streaming' || audio.status === 'complete'
        );
        const allError = response.every((audio) => audio.status === 'error');
        if (allCompleted || allError) {
          return response;
        }
        lastResponse = response;
        await sleep(3, 6);
        await this.keepAlive(true);
      }
      return lastResponse;
    } else {
      return responseData.clips.map((audio: any) => ({
        id: audio.id,
        title: audio.title,
        image_url: audio.image_url,
        lyric: audio.metadata.prompt,
        audio_url: audio.audio_url,
        video_url: audio.video_url,
        created_at: audio.created_at,
        model_name: audio.model_name,
        status: audio.status,
        gpt_description_prompt: audio.metadata.gpt_description_prompt,
        prompt: audio.metadata.prompt,
        type: audio.metadata.type,
        tags: audio.metadata.tags,
        negative_tags: audio.metadata.negative_tags,
        duration: audio.metadata.duration
      }));
    }
  }

  /**
   * Generates lyrics based on a given prompt.
   * @param prompt The prompt for generating lyrics.
   * @returns The generated lyrics text.
   */
  public async generateLyrics(prompt: string): Promise<string> {
    await this.keepAlive(false);
    // Initiate lyrics generation
    const generateResponse = await this.client.post(
      `${SunoApi.BASE_URL}/api/generate/lyrics/`,
      { prompt }
    );
    const generateId = generateResponse.data.id;

    // Poll for lyrics completion
    let lyricsResponse = await this.client.get(
      `${SunoApi.BASE_URL}/api/generate/lyrics/${generateId}`
    );
    while (lyricsResponse?.data?.status !== 'complete') {
      await sleep(2); // Wait for 2 seconds before polling again
      lyricsResponse = await this.client.get(
        `${SunoApi.BASE_URL}/api/generate/lyrics/${generateId}`
      );
    }

    // Return the generated lyrics text
    return lyricsResponse.data;
  }

  /**
   * Extends an existing audio clip by generating additional content based on the provided prompt.
   *
   * @param audioId The ID of the audio clip to extend.
   * @param prompt The prompt for generating additional content.
   * @param continueAt Extend a new clip from a song at mm:ss(e.g. 00:30). Default extends from the end of the song.
   * @param tags Style of Music.
   * @param title Title of the song.
   * @returns A promise that resolves to an AudioInfo object representing the extended audio clip.
   */
  public async extendAudio(
    audioId: string,
    prompt: string = '',
    continueAt: number,
    tags: string = '',
    negative_tags: string = '',
    title: string = '',
    model?: string,
    wait_audio?: boolean
  ): Promise<AudioInfo[]> {
    return this.generateSongs(
      prompt,
      true,
      tags,
      title,
      false,
      model,
      wait_audio,
      negative_tags,
      'extend',
      audioId,
      continueAt
    );
  }

  /**
   * Generate stems for a song.
   * @param song_id The ID of the song to generate stems for.
   * @returns A promise that resolves to an AudioInfo object representing the generated stems.
   */
  public async generateStems(song_id: string): Promise<AudioInfo[]> {
    await this.keepAlive(false);
    const response = await this.client.post(
      `${SunoApi.BASE_URL}/api/edit/stems/${song_id}`,
      {}
    );

    console.log('generateStems response:\n', response?.data);
    return response.data.clips.map((clip: any) => ({
      id: clip.id,
      status: clip.status,
      created_at: clip.created_at,
      title: clip.title,
      stem_from_id: clip.metadata.stem_from_id,
      duration: clip.metadata.duration
    }));
  }

  /**
   * Get the lyric alignment for a song.
   * @param song_id The ID of the song to get the lyric alignment for.
   * @returns A promise that resolves to an object containing the lyric alignment.
   */
  public async getLyricAlignment(song_id: string): Promise<object> {
    await this.keepAlive(false);
    const response = await this.client.get(
      `${SunoApi.BASE_URL}/api/gen/${song_id}/aligned_lyrics/v2/`
    );

    console.log(`getLyricAlignment ~ response:`, response.data);
    return response.data?.aligned_words.map((transcribedWord: any) => ({
      word: transcribedWord.word,
      start_s: transcribedWord.start_s,
      end_s: transcribedWord.end_s,
      success: transcribedWord.success,
      p_align: transcribedWord.p_align
    }));
  }

  /**
   * Processes the lyrics (prompt) from the audio metadata into a more readable format.
   * @param prompt The original lyrics text.
   * @returns The processed lyrics text.
   */
  private parseLyrics(prompt: string): string {
    // Assuming the original lyrics are separated by a specific delimiter (e.g., newline), we can convert it into a more readable format.
    // The implementation here can be adjusted according to the actual lyrics format.
    // For example, if the lyrics exist as continuous text, it might be necessary to split them based on specific markers (such as periods, commas, etc.).
    // The following implementation assumes that the lyrics are already separated by newlines.

    // Split the lyrics using newline and ensure to remove empty lines.
    const lines = prompt.split('\n').filter((line) => line.trim() !== '');

    // Reassemble the processed lyrics lines into a single string, separated by newlines between each line.
    // Additional formatting logic can be added here, such as adding specific markers or handling special lines.
    return lines.join('\n');
  }

  /**
   * Retrieves audio information for the given song IDs.
   * @param songIds An optional array of song IDs to retrieve information for.
   * @param page An optional page number to retrieve audio information from.
   * @returns A promise that resolves to an array of AudioInfo objects.
   */
  public async get(
    songIds?: string[],
    page?: string | null
  ): Promise<AudioInfo[]> {
    await this.keepAlive(false);
    let url = new URL(`${SunoApi.BASE_URL}/api/feed/v2`);
    if (songIds) {
      url.searchParams.append('ids', songIds.join(','));
    }
    if (page) {
      url.searchParams.append('page', page);
    }
    logger.info('Get audio status: ' + url.href);
    const response = await this.client.get(url.href, {
      // 10 seconds timeout
      timeout: 10000
    });

    const audios = response.data.clips;

    return audios.map((audio: any) => this.mapClip(audio));
  }

  /** Maps a raw Suno clip (feed/v2 or feed/v3 shape) to our AudioInfo. */
  private mapClip(audio: any): AudioInfo {
    return {
      id: audio.id,
      title: audio.title,
      image_url: audio.image_url,
      image_large_url: audio.image_large_url,
      lyric: audio.metadata?.prompt
        ? this.parseLyrics(audio.metadata.prompt)
        : '',
      audio_url: audio.audio_url,
      video_url: audio.video_url,
      created_at: audio.created_at,
      model_name: audio.model_name,
      status: audio.status,
      gpt_description_prompt: audio.metadata?.gpt_description_prompt,
      prompt: audio.metadata?.prompt,
      type: audio.metadata?.type,
      tags: audio.metadata?.tags,
      duration: audio.metadata?.duration,
      error_message: audio.metadata?.error_message,
      // feed/v3 exposes these at top level (also present in feed/v2 clips).
      play_count: audio.play_count,
      upvote_count: audio.upvote_count,
      is_liked: audio.is_liked
    };
  }

  /**
   * Loads the user's workspace via Suno's feed/v3 endpoint
   * (`POST /api/feed/v3`). This mirrors what suno.com's own client sends:
   * the default workspace filter, plus `filters.searchText` ONLY when a search
   * term is supplied.
   *
   * feed/v3 is cursor-based. The response doesn't return an explicit cursor, so
   * callers paginate by passing the id of the last clip they received as
   * `cursor` for the next page.
   *
   * @param searchText Optional text to match against song names (server-side).
   * @param cursor Optional pagination cursor (id of the last clip seen).
   * @param limit Page size (Suno's web client uses 20).
   */
  public async getWorkspaceFeed(
    searchText?: string,
    cursor?: string | null,
    limit: number = 20
  ): Promise<AudioInfo[]> {
    await this.keepAlive(false);
    const url = `${SunoApi.BASE_URL}/api/feed/v3`;
    const filters: any = {
      disliked: 'False',
      trashed: 'False',
      fromStudioProject: { presence: 'False' },
      stem: { presence: 'False' },
      workspace: { presence: 'True', workspaceId: 'default' }
    };
    if (searchText && searchText.trim()) {
      filters.searchText = searchText.trim();
    }
    const body = { cursor: cursor ?? null, limit, filters };
    logger.info(
      { searchText: searchText ?? null, cursor: cursor ?? null, limit },
      'Workspace feed/v3'
    );
    const response = await this.client.post(url, body, { timeout: 10000 });
    const data = response.data ?? {};
    const clips = Array.isArray(data) ? data : data.clips ?? data.items ?? [];
    return clips.map((audio: any) => this.mapClip(audio));
  }

  /**
   * Retrieves information for a specific audio clip.
   * @param clipId The ID of the audio clip to retrieve information for.
   * @returns A promise that resolves to an object containing the audio clip information.
   */
  public async getClip(clipId: string): Promise<object> {
    await this.keepAlive(false);
    const response = await this.client.get(
      `${SunoApi.BASE_URL}/api/clip/${clipId}`
    );
    return response.data;
  }

  public async get_credits(): Promise<object> {
    await this.keepAlive(false);
    const response = await this.client.get(
      `${SunoApi.BASE_URL}/api/billing/info/`
    );
    return {
      credits_left: response.data.total_credits_left,
      period: response.data.period,
      monthly_limit: response.data.monthly_limit,
      monthly_usage: response.data.monthly_usage
    };
  }

  public async getPersonaPaginated(
    personaId: string,
    page: number = 1
  ): Promise<PersonaResponse> {
    await this.keepAlive(false);

    const url = `${SunoApi.BASE_URL}/api/persona/get-persona-paginated/${personaId}/?page=${page}`;

    logger.info(`Fetching persona data: ${url}`);

    const response = await this.client.get(url, {
      timeout: 10000 // 10 seconds timeout
    });

    if (response.status !== 200) {
      throw new Error('Error response: ' + response.statusText);
    }

    return response.data;
  }
}

export const sunoApi = async (cookie?: string) => {
  const resolvedCookie =
    cookie && cookie.includes('__client') ? cookie : process.env.SUNO_COOKIE; // Check for bad `Cookie` header (It's too expensive to actually parse the cookies *here*)
  if (!resolvedCookie) {
    logger.info(
      'No cookie provided! Aborting...\nPlease provide a cookie either in the .env file or in the Cookie header of your request.'
    );
    throw new Error(
      'Please provide a cookie either in the .env file or in the Cookie header of your request.'
    );
  }

  // Check if the instance for this cookie already exists in the cache
  const cachedInstance = cache.get(resolvedCookie);
  if (cachedInstance) return cachedInstance;

  // If not, create a new instance and initialize it
  const instance = await new SunoApi(resolvedCookie).init();
  // Cache the initialized instance
  cache.set(resolvedCookie, instance);

  return instance;
};
