// Build-time prerender. Run after `vite build`:
//   - inlines the (small) main stylesheet into dist/index.html, removing a
//     render-blocking request;
//   - writes dist/transform/<from>/<to>.html for every documented shift:
//     full page markup + <head> + the data it was rendered from, so the content
//     (and LCP) no longer waits for the JS bundle and three JSON fetches.
//     The client hydrates this markup (src/main.tsx).
//
// Usage: npx tsx scripts/prerender.ts
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';
import { buildPayload } from '../src/data/transformPayload';
import type { PayloadContext, SourceMeta } from '../src/data/transformPayload';
import { transformSeo, headTagsToHtml, jsonForScript, SITE_ORIGIN } from '../src/seo/transformSeo';
import type { HeadTag } from '../src/seo/transformSeo';
import { hubSeo } from '../src/seo/hubSeo';
import type { DirectoryPayload, HubPayload, PagePayload } from '../src/data/transformPayload';
import type { IPASymbol, Transformation, TransformationMeta } from '../src/data/loader';
import { execSync } from 'child_process';
import { transformSummary } from '../src/utils/transformMeta';
import { lawFor } from '../src/data/laws';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const DATA = path.join(ROOT, 'public/data');

const readJson = <T>(p: string): T => JSON.parse(fs.readFileSync(p, 'utf8'));

// file name -> date (YYYY-MM-DD) of its last commit. Needs full history in CI
// (deploy-pages.yml checks out with fetch-depth 0); empty when git is unavailable.
function lastCommitDates(dir: string): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const log = execSync(`git log --pretty=format:@@%cs --name-only -- "${dir}"`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
    let date = '';
    for (const line of log.split('\n')) {
      if (line.startsWith('@@')) date = line.slice(2);
      else if (line.trim() && !map.has(path.basename(line))) map.set(path.basename(line), date);
    }
  } catch (err) {
    console.warn('git log failed; pages ship without a last-updated date:', (err as Error).message);
  }
  return map;
}

function inlineCss(html: string): string {
  return html.replace(
    /<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/,
    (_m, href: string) => `<style>${fs.readFileSync(path.join(DIST, href), 'utf8')}</style>`
  );
}

// Static <head> defaults in index.html that a page-specific head replaces.
const STATIC_HEAD_PATTERNS: RegExp[] = [
  /<title>[\s\S]*?<\/title>\s*/i,
  /<meta name="(?:title|description|keywords|robots)"[^>]*>\s*/gi,
  /<meta property="og:(?!site_name|locale)[^"]*"[^>]*>\s*/gi,
  /<meta name="twitter:[^"]*"[^>]*>\s*/gi,
  /<link rel="canonical"[^>]*>\s*/i,
  /<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/i,
  /<noscript><h1>[\s\S]*?<\/noscript>\s*/i,
];

function withPageHead(template: string, headHtml: string): string {
  let html = template;
  for (const re of STATIC_HEAD_PATTERNS) html = html.replace(re, '');
  return html.replace('</head>', `    ${headHtml}\n  </head>`);
}

async function main() {
  const indexPath = path.join(DIST, 'index.html');
  if (!fs.existsSync(indexPath)) throw new Error('dist/index.html missing: run `vite build` first');
  const template = inlineCss(fs.readFileSync(indexPath, 'utf8'));
  fs.writeFileSync(indexPath, template);

  // Catalogue + lookups (all produced by scripts/rebuild-index.ts).
  const manifest = readJson<{ symbols: { id: string; symbol: string; name?: string }[]; stats: { families: string[] }; shards: { transformations: string[] } }>(
    path.join(DATA, 'index.json')
  );
  const catalog: TransformationMeta[] = manifest.shards.transformations.flatMap((f) =>
    readJson<TransformationMeta[]>(path.join(DATA, 'shards', f))
  );
  const mappedPath = path.join(DATA, 'sources_mapped.json');
  const ctx: PayloadContext = {
    catalog,
    symbols: manifest.symbols,
    families: manifest.stats.families,
    mappedSources: fs.existsSync(mappedPath) ? readJson<Record<string, SourceMeta>>(mappedPath) : {},
  };

  const symbolCache = new Map<string, IPASymbol>();
  const symbol = (id: string) => {
    if (!symbolCache.has(id)) {
      symbolCache.set(id, readJson<IPASymbol>(path.join(DATA, 'symbols', `${id}.json`)));
    }
    return symbolCache.get(id)!;
  };

  const vite = await createServer({
    root: ROOT,
    appType: 'custom',
    server: { middlewareMode: true },
    logLevel: 'error',
  });
  try {
    const { renderApp } = (await vite.ssrLoadModule('/src/ssr-entry.tsx')) as {
      renderApp: (p: string, payload: unknown) => Promise<string>;
    };

    async function writePage(urlPath: string, payload: unknown, head: HeadTag[] | null, outRel: string) {
      // React emits resource hints (e.g. the logo <img> preload) at the start of
      // the markup; the client hoists them itself, so keep them out of #root.
      let body = (await renderApp(urlPath, payload)).replace(/^(?:<link rel="preload"[^>]*\/>)+/, '');
      let headHtml: string;
      if (head) {
        headHtml = headTagsToHtml(head);
      } else {
        // Pages that render their own <title>/<meta>/<link>: React emits those
        // hoisted tags first; move them into <head> and keep them out of #root.
        const hoisted = body.match(/^(?:<title>[\s\S]*?<\/title>|<(?:meta|link)\b[^>]*\/>)+/);
        if (!hoisted) throw new Error(`${urlPath}: no head tags rendered`);
        headHtml = hoisted[0];
        body = body.slice(hoisted[0].length);
      }
      let html = withPageHead(template, headHtml);
      html = html.replace(
        '<div id="root"></div>',
        () =>
          `<div id="root" data-prerendered>${body}</div>\n    <script type="application/json" id="page-payload">${jsonForScript(payload)}</script>`
      );
      if (!html.includes('data-prerendered')) throw new Error('index.html has no empty #root to fill');
      const out = path.join(DIST, outRel);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, html);
    }

    const dir = path.join(DATA, 'transformations');
    const updated = lastCommitDates('public/data/transformations');
    const symbolOf = new Map(manifest.symbols.map((s) => [s.id, s.symbol]));
    const byId = new Map<string, Transformation>();
    let written = 0;
    const skipped: string[] = [];
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const t = readJson<Transformation>(path.join(dir, file));
      const { fromId, toId } = t;
      byId.set(`${fromId}_to_${toId}`, t);
      if (file !== `${fromId}_to_${toId}.json`) {
        skipped.push(`${file} (ids do not match filename)`);
        continue;
      }
      let payload;
      try {
        payload = buildPayload(fromId, toId, symbol(fromId), symbol(toId), t, ctx);
        if (updated.has(file)) payload.updated = updated.get(file);
      } catch (err) {
        skipped.push(`${file} (${(err as Error).message})`);
        continue;
      }

      const seo = transformSeo({
        fromId,
        toId,
        fromSymbol: payload.fromSymbol,
        toSymbol: payload.toSymbol,
        transformation: t,
        mappedSources: payload.mappedSources,
        updated: payload.updated,
      });
      const urlPath = `/transform/${encodeURIComponent(fromId)}/${encodeURIComponent(toId)}`;
      // <to>.html, not <to>/index.html: Cloudflare Pages serves /transform/p/f
      // from f.html directly, whereas a directory index would 308-redirect to
      // /transform/p/f/ (and disagree with the canonical URL and sitemap).
      await writePage(urlPath, payload, seo.head, path.join('transform', fromId, `${toId}.html`));
      written++;
    }
    // Hubs. Same membership rules as HubPage / the sitemap: languages live in
    // `languages`, families and processes in `tags`.
    const familySet = new Set(manifest.stats.families);
    const byMode: Record<HubPayload['mode'], Map<string, HubPayload['shifts']>> = {
      language: new Map(),
      family: new Map(),
      process: new Map(),
    };
    const add = (m: Map<string, HubPayload['shifts']>, key: string, t: TransformationMeta) => {
      if (!m.has(key)) m.set(key, []);
      const [from, to] = t.id.split('_to_');
      m.get(key)!.push({ id: t.id, name: t.name, pair: `[${symbolOf.get(from) || from}] → [${symbolOf.get(to) || to}]` });
    };
    for (const t of catalog) {
      for (const l of t.languages || []) add(byMode.language, l, t);
      for (const tag of t.tags || []) add(familySet.has(tag) ? byMode.family : byMode.process, tag, t);
    }
    // Names that are awkward as file names / URL path segments stay on the SPA.
    const safeName = (n: string) => !/[\\/?#%:*"<>|]/.test(n) && !n.startsWith('.') && n.trim() === n;
    let hubs = 0;
    for (const [mode, groups] of Object.entries(byMode) as [HubPayload['mode'], typeof byMode.language][]) {
      for (const [name, shifts] of groups) {
        if (shifts.length < 2 || !safeName(name)) continue;
        const law = mode === 'process' && lawFor(name);
        const payload: HubPayload = {
          kind: 'hub',
          mode,
          name,
          shifts: law
            ? shifts.map((s) => {
                const t = byId.get(s.id);
                const [from, to] = s.id.split('_to_');
                return t ? { ...s, summary: transformSummary(symbol(from), symbol(to), t) } : s;
              })
            : shifts,
        };
        await writePage(`/${mode}/${encodeURIComponent(name)}`, payload, hubSeo(mode, name, shifts.length).head, path.join(mode, `${name}.html`));
        hubs++;
      }
    }
    // Content pages. They render their own head tags (head = null).
    const statics: [string, PagePayload][] = [
      ['about', { kind: 'static' }],
      ['glossary', { kind: 'static' }],
      ['families', { kind: 'families', families: [...manifest.stats.families] }],
      ['laws', { kind: 'static' }],
    ];
    const symName = new Map(manifest.symbols.map((s) => [s.id, s]));
    const byFrom = new Map<string, DirectoryPayload['groups'][number]>();
    for (const t of catalog) {
      const [from, to] = t.id.split('_to_');
      if (!byFrom.has(from)) {
        const f = symName.get(from);
        byFrom.set(from, { fromId: from, symbol: f?.symbol || from, name: f?.name || '', shifts: [] });
      }
      byFrom.get(from)!.shifts.push({ id: t.id, name: t.name, toSymbol: symName.get(to)?.symbol || '' });
    }
    statics.push([
      'directory',
      {
        kind: 'directory',
        total: catalog.length,
        groups: [...byFrom.values()].sort((a, b) => a.fromId.localeCompare(b.fromId)),
      },
    ]);
    for (const [name, payload] of statics) await writePage(`/${name}`, payload, null, `${name}.html`);

    // Pages that fetch their data client-side ship the app shell with their own head.
    const m = (k: 'name' | 'property', n: string, content: string): HeadTag => ({ tag: 'meta', attrs: { [k]: n, content } });
    const shellHead = (route: string, title: string, desc: string): HeadTag[] => {
      const url = `${SITE_ORIGIN}${route}`;
      return [
        { tag: 'title', attrs: {}, text: title },
        m('name', 'description', desc),
        m('name', 'robots', 'index, follow'),
        { tag: 'link', attrs: { rel: 'canonical', href: url } },
        m('property', 'og:type', 'website'),
        m('property', 'og:url', url),
        m('property', 'og:title', title),
        m('property', 'og:description', desc),
        m('property', 'og:image', `${SITE_ORIGIN}/og-preview.png`),
        m('name', 'twitter:card', 'summary_large_image'),
        m('name', 'twitter:title', title),
        m('name', 'twitter:description', desc),
        m('name', 'twitter:image', `${SITE_ORIGIN}/og-preview.png`),
      ];
    };
    const landmarkCount = catalog.filter((t) => t.commonality === 5).length;
    const summary = `${catalog.length} documented phonetic shifts across ${manifest.stats.languages.length} languages`;
    const shells: [string, string, string][] = [
      ['sources', 'Bibliography | EchoDrift — Phonetic Transformation Sources',
        'Scholarly sources and linguistic databases used to document the evolution of sounds.'],
      ['landmarks', 'Landmark Sound Changes | EchoDrift',
        `The ${landmarkCount} most widespread sound changes in the EchoDrift atlas, each attested in many unrelated language families: lenition, palatalization, debuccalization and more.`],
      ['stats', 'Atlas Health | EchoDrift Coverage Statistics',
        `Live statistics for the EchoDrift atlas: ${summary}, with sources, allophones and IPA matrix coverage.`],
    ];
    for (const [name, title, desc] of shells) {
      fs.writeFileSync(path.join(DIST, `${name}.html`), withPageHead(template, headTagsToHtml(shellHead(`/${name}`, title, desc))));
    }

    // Renamed shifts: GitHub Pages cannot send a 301, so the old URL gets an
    // instant meta refresh (which Google treats as a permanent redirect) plus a
    // canonical pointing at the new page.
    const redirects = readJson<Record<string, string>>(path.join(DATA, 'redirects.json'));
    let redirected = 0;
    for (const [oldId, newId] of Object.entries(redirects)) {
      const [of, ot] = oldId.split('_to_');
      const out = path.join(DIST, 'transform', of, `${ot}.html`);
      if (fs.existsSync(out) || !byId.has(newId)) continue;
      const [nf, nt] = newId.split('_to_');
      const target = `${SITE_ORIGIN}/transform/${encodeURIComponent(nf)}/${encodeURIComponent(nt)}`;
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(
        out,
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved</title><link rel="canonical" href="${target}"><meta http-equiv="refresh" content="0; url=${target}"></head><body><p>This shift has moved to <a href="${target}">${target}</a>.</p></body></html>\n`
      );
      redirected++;
    }

    // Hub pages whose name was merged into another (old language labels that got
    // impressions): same meta-refresh stub, pointing at the surviving hub.
    const hubRedirects = readJson<Record<string, string>>(path.join(DATA, 'hub-redirects.json'));
    for (const [oldPath, newPath] of Object.entries(hubRedirects)) {
      const out = path.join(DIST, `${oldPath}.html`);
      if (fs.existsSync(out) || !fs.existsSync(path.join(DIST, `${newPath}.html`))) continue;
      const [mode, name] = newPath.split('/');
      const target = `${SITE_ORIGIN}/${mode}/${encodeURIComponent(name)}`;
      fs.writeFileSync(
        out,
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved</title><link rel="canonical" href="${target}"><meta http-equiv="refresh" content="0; url=${target}"></head><body><p>This page has moved to <a href="${target}">${target}</a>.</p></body></html>\n`
      );
      redirected++;
    }

    // GitHub Pages answers unknown paths with 404.html and a real 404 status. Use
    // the app shell so client-side routes without a prerendered page (compare,
    // thin hubs) still render for people.
    // Keep it out of the index: the 404 shell must never be indexable.
    const shell404 = fs.readFileSync(indexPath, 'utf8').replace(
      /<meta name="robots"[^>]*>/i,
      '<meta name="robots" content="noindex, follow">'
    );
    fs.writeFileSync(path.join(DIST, '404.html'), shell404);

    console.log(`Prerendered ${written} transform pages, ${hubs} hubs, ${statics.length} content pages and ${redirected} redirects${skipped.length ? `, skipped ${skipped.length}` : ''}`);
    skipped.forEach((s) => console.warn('  skipped:', s));
  } finally {
    await vite.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
