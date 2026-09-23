// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { onRequest } from './_middleware.js';

const ROOT = path.join(__dirname, '..');
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

// public/data/index.json + shards are build artifacts (gitignored); generate
// them when running from a bare checkout (CI).
beforeAll(() => {
  if (!fs.existsSync(path.join(ROOT, 'public/data/index.json'))) {
    execSync('npx tsx scripts/rebuild-index.ts', { cwd: ROOT, stdio: 'inherit' });
  }
}, 120_000);

// Fake Cloudflare ASSETS binding backed by ./public. Mimics the real Pages
// asset server: "/" is index.html, and ANY missing path also gets index.html
// with a 200 (SPA fallback) — never a 404.
function makeAssets(opts: { hideIndex?: boolean } = {}) {
  const index = () => new Response(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), { headers: { 'content-type': 'text/html; charset=utf-8' } });
  return {
    fetch: async (req: Request) => {
      const p = decodeURIComponent(new URL(req.url).pathname);
      if (p === '/') return index();
      if (opts.hideIndex && p === '/data/index.json') return index();
      const file = path.join(ROOT, 'public', p);
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return index();
      return new Response(fs.readFileSync(file), { headers: { 'content-type': p.endsWith('.json') ? 'application/json' : 'text/plain' } });
    },
  };
}

async function get(pathname: string, ua = '', assets = makeAssets(), handler: typeof onRequest = onRequest) {
  const request = new Request('https://echodrift.pages.dev' + pathname, { headers: ua ? { 'user-agent': ua } : {} });
  const env = { ASSETS: assets };
  const next = () => assets.fetch(request);
  const res = await handler({ request, env, next });
  return { status: res.status, html: await res.text() };
}

// A symbol pair that exists in /data/symbols but has no transformation file.
function undocumentedPair(): [string, string] {
  const symbols = fs.readdirSync(path.join(ROOT, 'public/data/symbols')).map((f) => f.replace(/\.json$/, ''));
  const files = new Set(fs.readdirSync(path.join(ROOT, 'public/data/transformations')));
  for (const a of symbols) for (const b of symbols) if (a !== b && !files.has(`${a}_to_${b}.json`)) return [a, b];
  throw new Error('every pair documented?!');
}

describe('middleware 404 handling', () => {
  it('serves documented transform pages with 200 (crawler and user)', async () => {
    expect((await get('/transform/ei/e', GOOGLEBOT)).status).toBe(200);
    expect((await get('/transform/ei/e')).status).toBe(200);
  });

  it('returns 404 for an unknown transform pair, still rendering the SPA shell', async () => {
    const bot = await get('/transform/nonexistent/zzz', GOOGLEBOT);
    expect(bot.status).toBe(404);
    expect(bot.html).toContain('id="root"');
    const user = await get('/transform/nonexistent/zzz');
    expect(user.status).toBe(404);
    expect(user.html).toContain('id="root"');
  });

  it('returns 404 + noindex for a known-symbol pair with no data file', async () => {
    const [a, b] = undocumentedPair();
    const bot = await get(`/transform/${a}/${b}`, GOOGLEBOT);
    expect(bot.status).toBe(404);
    expect(bot.html).toContain('noindex');
    expect((await get(`/transform/${a}/${b}`)).status).toBe(404);
  });

  it('returns 404 for hubs that list nothing, 200 for populated hubs', async () => {
    expect((await get('/family/Germanic', GOOGLEBOT)).status).toBe(200);
    expect((await get('/family/Germanic')).status).toBe(200);
    expect((await get('/family/Nope', GOOGLEBOT)).status).toBe(404);
    expect((await get('/family/Nope')).status).toBe(404);
    expect((await get('/language/Klingon', GOOGLEBOT)).status).toBe(404);
    expect((await get('/language/Klingon')).status).toBe(404);
    expect((await get('/process/Fronting')).status).toBe(200);
  });

  it('keeps thin language hubs at 200 + noindex', async () => {
    // Find a language with exactly one shift.
    const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/index.json'), 'utf8'));
    const shards = index.shards.transformations.flatMap((f: string) => JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/shards', f), 'utf8')));
    const counts: Record<string, number> = {};
    for (const t of shards) for (const l of t.languages || []) counts[l] = (counts[l] || 0) + 1;
    const thin = Object.entries(counts).find(([, n]) => n === 1)![0];
    const res = await get(`/language/${encodeURIComponent(thin)}`, GOOGLEBOT);
    expect(res.status).toBe(200);
    expect(res.html).toContain('noindex, follow');
  });

  it('returns 404 for unknown route shapes and 200 for static routes', async () => {
    expect((await get('/no-such-page')).status).toBe(404);
    expect((await get('/no-such-page', GOOGLEBOT)).status).toBe(404);
    expect((await get('/a/b/c/d')).status).toBe(404);
    expect((await get('/about')).status).toBe(200);
    expect((await get('/about', GOOGLEBOT)).status).toBe(200);
    expect((await get('/', GOOGLEBOT)).status).toBe(200);
  });

  it('fails open when the catalogue cannot be loaded, then recovers', async () => {
    // Fresh module instance so the per-isolate catalogue cache is empty.
    vi.resetModules();
    const fresh = (await import('./_middleware.js')).onRequest;
    const broken = makeAssets({ hideIndex: true });
    expect((await get('/family/Nope', '', broken, fresh)).status).toBe(200);
    expect((await get('/family/Nope', GOOGLEBOT, broken, fresh)).status).toBe(200);
    // Once the data is reachable again the empty catalogue must not stay cached.
    expect((await get('/family/Nope', '', makeAssets(), fresh)).status).toBe(404);
  });
});

describe('transform page meta', () => {
  it('uses IPA ɛ (not Greek ε), names a language in the title, and keeps description short', async () => {
    const { html } = await get('/transform/ash/eps', GOOGLEBOT);
    const title = html.match(/<title>([^<]*)<\/title>/)![1];
    const desc = html.match(/<meta name="description" content="([^"]*)"/)![1];
    expect(title).toContain('[ɛ]');
    expect(title).not.toContain('ε');
    expect(title).toMatch(/ in Southern American English \+2 \| EchoDrift$/);
    expect(desc).toContain('attested in Southern American English, New Zealand English and South African English');
    expect(desc.length).toBeLessThanOrEqual(158);
    expect(html).toContain('<meta name="robots" content="index, follow"');
  });

  it('noindexes a documented pair that has no language examples', async () => {
    const { status, html } = await get('/transform/a/uo', GOOGLEBOT);
    expect(status).toBe(200);
    expect(html).toContain('<meta name="robots" content="noindex, follow"');
  });
});

describe('hub thin-page rule', () => {
  it('noindexes a process hub with a single shift, indexes a large one', async () => {
    const shards = fs.readdirSync(path.join(ROOT, 'public/data/shards')).filter((f) => f.startsWith('transformations-'));
    const counts = new Map<string, number>();
    for (const f of shards)
      for (const t of JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/shards', f), 'utf8')))
        for (const tag of t.tags || []) counts.set(tag, (counts.get(tag) || 0) + 1);
    const single = [...counts].find(([, n]) => n === 1)![0];
    const thin = await get('/process/' + encodeURIComponent(single), GOOGLEBOT);
    expect(thin.status).toBe(200);
    expect(thin.html).toContain('<meta name="robots" content="noindex, follow"');
    const big = await get('/process/Raising', GOOGLEBOT);
    expect(big.html).toContain('<meta name="robots" content="index, follow"');
  });
});

describe('hub canonical redirects', () => {
  it('301s a spelling variant of a process tag to the canonical hub', async () => {
    const request = new Request('https://echodrift.pages.dev/process/Vowel%20shift');
    const assets = makeAssets();
    const res = await onRequest({ request, env: { ASSETS: assets }, next: () => assets.fetch(request) });
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('https://echodrift.pages.dev/process/Vowel%20Shift');
  });

  it('301s a former language-name tag to the language hub', async () => {
    const request = new Request('https://echodrift.pages.dev/process/Arabic');
    const assets = makeAssets();
    const res = await onRequest({ request, env: { ASSETS: assets }, next: () => assets.fetch(request) });
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toMatch(/\/language\/[^/]*Arabic/);
  });

  it('leaves a live hub alone', async () => {
    expect((await get('/process/Raising', GOOGLEBOT)).status).toBe(200);
  });
});
