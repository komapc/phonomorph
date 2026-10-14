// Build-time prerender. Run after `vite build`:
//   - inlines the (small) main stylesheet into dist/index.html, removing a
//     render-blocking request;
//   - writes dist/transform/<from>/<to>/index.html for every documented shift:
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
import { transformSeo, headTagsToHtml, jsonForScript } from '../src/seo/transformSeo';
import type { IPASymbol, Transformation, TransformationMeta } from '../src/data/loader';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const DATA = path.join(ROOT, 'public/data');

const readJson = <T>(p: string): T => JSON.parse(fs.readFileSync(p, 'utf8'));

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
  const manifest = readJson<{ symbols: { id: string; symbol: string }[]; stats: { families: string[] }; shards: { transformations: string[] } }>(
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
      renderApp: (p: string, payload: unknown) => string;
    };

    const dir = path.join(DATA, 'transformations');
    let written = 0;
    const skipped: string[] = [];
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const t = readJson<Transformation>(path.join(dir, file));
      const { fromId, toId } = t;
      if (file !== `${fromId}_to_${toId}.json`) {
        skipped.push(`${file} (ids do not match filename)`);
        continue;
      }
      let payload;
      try {
        payload = buildPayload(fromId, toId, symbol(fromId), symbol(toId), t, ctx);
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
      });
      const urlPath = `/transform/${encodeURIComponent(fromId)}/${encodeURIComponent(toId)}`;
      // React emits resource hints (e.g. the logo <img> preload) at the start of
      // the markup; the client hoists them itself, so keep them out of #root.
      const body = renderApp(urlPath, payload).replace(/^(?:<link rel="preload"[^>]*\/>)+/, '');

      let html = withPageHead(template, headTagsToHtml(seo.head));
      html = html.replace(
        '<div id="root"></div>',
        () =>
          `<div id="root" data-prerendered>${body}</div>\n    <script type="application/json" id="transform-payload">${jsonForScript(payload)}</script>`
      );
      if (!html.includes('data-prerendered')) throw new Error('index.html has no empty #root to fill');

      const outDir = path.join(DIST, 'transform', fromId, toId);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'index.html'), html);
      written++;
    }
    console.log(`Prerendered ${written} transform pages${skipped.length ? `, skipped ${skipped.length}` : ''}`);
    skipped.forEach((s) => console.warn('  skipped:', s));
  } finally {
    await vite.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
