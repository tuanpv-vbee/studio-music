/**
 * Debug script: launch Suno in a visible browser using your SUNO_COOKIE,
 * navigate to /create, and dump:
 *   - cookies after Clerk init
 *   - window.Clerk session info
 *   - the actual DOM selectors for the prompt textarea + Create button
 *   - any network request that fails
 *
 * Run: npx tsx scripts/debug-suno.ts
 * (or: npx ts-node scripts/debug-suno.ts)
 */
import { chromium } from 'playwright';
import * as cookieLib from 'cookie';
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as path from 'node:path';

// Minimal .env loader (avoids dotenv dep)
function loadEnv() {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../suno-api/.env'),
    path.resolve(__dirname, '../suno-api/.env'),
  ];
  for (const p of candidates) {
    if (!fsSync.existsSync(p)) continue;
    const raw = fsSync.readFileSync(p, 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      const k = m[1];
      let v = m[2].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
  }
}
loadEnv();

const SUNO_COOKIE = process.env.SUNO_COOKIE;
if (!SUNO_COOKIE) {
  console.error('SUNO_COOKIE not set in .env');
  process.exit(1);
}

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36';

async function main() {
  const browser = await chromium.launch({
    headless: false, // <-- VISIBLE so user can watch
    slowMo: 200, // slow each action so user can see
    args: ['--auto-open-devtools-for-tabs'],
  });
  const context = await browser.newContext({
    userAgent: UA,
    viewport: { width: 1440, height: 900 },
  });

  // Seed cookies
  const parsed = cookieLib.parse(SUNO_COOKIE!);
  const seed = Object.entries(parsed)
    .filter(([, v]) => v !== undefined)
    .map(([name, value]) => ({
      name,
      value: value as string,
      domain: '.suno.com',
      path: '/',
      sameSite: 'Lax' as const,
    }));
  await context.addCookies(seed);

  const page = await context.newPage();

  // Log all failed requests
  page.on('requestfailed', (req) => {
    console.log('[FAIL]', req.method(), req.url(), '←', req.failure()?.errorText);
  });
  page.on('response', async (res) => {
    if (res.status() >= 400 && res.url().includes('suno.com')) {
      const url = res.url();
      let body = '';
      try { body = (await res.text()).slice(0, 300); } catch {}
      console.log('[HTTP', res.status(), ']', url, '\n   →', body);
    }
  });

  console.log('Navigating to https://suno.com/create ...');
  await page.goto('https://suno.com/create', { waitUntil: 'domcontentloaded' });
  console.log('Page URL after nav:', page.url());

  // Wait for Clerk to init
  console.log('Waiting for window.Clerk...');
  try {
    await page.waitForFunction(() => (window as any).Clerk?.loaded, { timeout: 30_000 });
  } catch {
    console.log('Clerk did not finish loading in 30s');
  }

  // Dump Clerk session info
  const info = await page.evaluate(async () => {
    const w = window as any;
    const out: any = {
      hasClerk: !!w.Clerk,
      clerkLoaded: w.Clerk?.loaded,
      hasSession: !!w.Clerk?.session,
    };
    if (w.Clerk?.session) {
      try { out.jwtPrefix = (await w.Clerk.session.getToken())?.slice(0, 24); } catch (e: any) { out.jwtError = String(e); }
      out.sessionId = w.Clerk.session.id;
      out.userId = w.Clerk.user?.id;
    }
    return out;
  });
  console.log('Clerk info:', JSON.stringify(info, null, 2));

  // Dump cookies after Clerk init
  const cookies = await context.cookies('https://suno.com');
  console.log('Cookies after init (names only):', cookies.map((c) => c.name).join(', '));

  // Dump all textareas
  console.log('\n--- Visible elements scan ---');
  const elems = await page.evaluate(() => {
    const out: any[] = [];
    document.querySelectorAll('textarea').forEach((t, i) => {
      const r = t.getBoundingClientRect();
      out.push({
        idx: i,
        testId: t.getAttribute('data-testid'),
        placeholder: t.placeholder,
        maxLength: t.maxLength,
        visible: r.width > 0 && r.height > 0,
        rect: { x: r.x | 0, y: r.y | 0, w: r.width | 0, h: r.height | 0 },
      });
    });
    return out;
  });
  console.log('Textareas:', JSON.stringify(elems, null, 2));

  const buttons = await page.evaluate(() => {
    const out: any[] = [];
    document.querySelectorAll('button').forEach((b, i) => {
      const r = b.getBoundingClientRect();
      const visible = r.width > 0 && r.height > 0;
      if (!visible) return;
      out.push({
        idx: i,
        text: b.textContent?.trim().slice(0, 40),
        ariaLabel: b.getAttribute('aria-label'),
      });
    });
    return out.slice(0, 30);
  });
  console.log('Visible buttons (first 30):', JSON.stringify(buttons, null, 2));

  // Save screenshot + HTML
  await fs.mkdir('/tmp/suno-debug', { recursive: true });
  const ts = Date.now();
  await page.screenshot({ path: `/tmp/suno-debug/manual-${ts}.png`, fullPage: true });
  await fs.writeFile(`/tmp/suno-debug/manual-${ts}.html`, await page.content());
  console.log(`Saved screenshot + HTML to /tmp/suno-debug/manual-${ts}.{png,html}`);

  console.log('\nBrowser will stay open. Press Ctrl+C to close.');
  await new Promise(() => {});
}

main().catch((e) => { console.error(e); process.exit(1); });
