// Build-time per-pair Open Graph images: dist/og/<from>/<to>.png (1200x630).
// Replaces the former edge function (functions/og/[from]/[to].js, workers-og):
// the same layout, rendered once at build with satori + resvg.
//
// Usage: npx tsx scripts/generate-og-pairs.ts   (after `vite build`)
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import satori from 'satori';
import { html as toVdom } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const DATA = path.join(ROOT, 'public/data');

interface Sym { symbol?: string; name?: string }
interface Trans { phoneticEffects?: string; certainty?: number; commonality?: number; isAllophone?: boolean }

const readJson = <T>(p: string): T => JSON.parse(fs.readFileSync(p, 'utf8'));
const sanitize = (s: string) => String(s).replace(/[<>&]/g, '');

const fonts = [
  { name: 'DejaVu Sans', data: fs.readFileSync(path.join(ROOT, 'public/fonts/DejaVuSans.ttf')), weight: 400 as const, style: 'normal' as const },
  { name: 'DejaVu Sans', data: fs.readFileSync(path.join(ROOT, 'public/fonts/DejaVuSans-Bold.ttf')), weight: 700 as const, style: 'normal' as const },
];

const symbolCache = new Map<string, Sym | null>();
const symbol = (id: string): Sym | null => {
  if (!symbolCache.has(id)) {
    const p = path.join(DATA, 'symbols', `${id}.json`);
    symbolCache.set(id, fs.existsSync(p) ? readJson<Sym>(p) : null);
  }
  return symbolCache.get(id)!;
};

function markup(fromId: string, toId: string, trans: Trans): string {
  const fromSym = symbol(fromId);
  const toSym = symbol(toId);
  const fromSymbol = sanitize(fromSym?.symbol || fromId);
  const toSymbol = sanitize(toSym?.symbol || toId);
  const effect = sanitize(((trans.phoneticEffects || '').split(',')[0] || 'Phonetic shift').trim());
  const subtitle = sanitize(
    fromSym?.name && toSym?.name ? `${fromSym.name} → ${toSym.name}` : 'Atlas of phonetic shifts & sound changes'
  );
  const pills: string[] = [];
  if (trans.certainty) pills.push(`Certainty ${trans.certainty}/5`);
  if (trans.commonality) pills.push(`Commonality ${trans.commonality}/5`);
  if (trans.isAllophone) pills.push('Allophone');
  const pillsHtml = pills
    .map(
      (p) =>
        `<div style="display:flex;background:#1e1e3a;border:1px solid #4f46e5;border-radius:100px;padding:8px 20px;margin-right:12px;color:#c7d2fe;font-size:24px;">${sanitize(p)}</div>`
    )
    .join('');
  return `
      <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#0b0e14;color:#ffffff;font-family:'DejaVu Sans';position:relative;">
        <div style="display:flex;width:10px;height:630px;background:#7c3aed;position:absolute;top:0;left:0;"></div>
        <div style="display:flex;flex-direction:column;padding:70px 80px;height:630px;justify-content:space-between;">
          <div style="display:flex;flex-direction:column;">
            <div style="display:flex;color:#7c8aff;font-size:26px;letter-spacing:4px;margin-bottom:20px;">PHONETIC SHIFT</div>
            <div style="display:flex;align-items:center;">
              <div style="display:flex;font-size:160px;font-weight:700;">[${fromSymbol}]</div>
              <div style="display:flex;font-size:110px;color:#7c8aff;margin:0 50px;">→</div>
              <div style="display:flex;font-size:160px;font-weight:700;">[${toSymbol}]</div>
            </div>
            <div style="display:flex;font-size:44px;color:#a5b4fc;font-weight:700;margin-top:24px;">${effect}</div>
            <div style="display:flex;font-size:30px;color:#9ca3c4;margin-top:12px;">${subtitle}</div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;">${pillsHtml}</div>
            <div style="display:flex;font-size:30px;font-weight:700;color:#ffffff;">EchoDrift</div>
          </div>
        </div>
      </div>`;
}

async function main() {
  if (!fs.existsSync(DIST)) throw new Error('dist/ missing: run `vite build` first');
  const dir = path.join(DATA, 'transformations');
  let written = 0;
  const failed: string[] = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const m = file.match(/^(.+)_to_(.+)\.json$/);
    if (!m) continue;
    const [, fromId, toId] = m;
    try {
      const svg = await satori(toVdom(markup(fromId, toId, readJson<Trans>(path.join(dir, file)))) as never, {
        width: 1200,
        height: 630,
        fonts,
      });
      const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: false } }).render().asPng();
      const out = path.join(DIST, 'og', fromId, `${toId}.png`);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, png);
      written++;
    } catch (err) {
      failed.push(`${file}: ${(err as Error).message}`);
    }
  }
  console.log(`Generated ${written} og images${failed.length ? `, failed ${failed.length}` : ''}`);
  failed.slice(0, 10).forEach((f) => console.warn('  failed:', f));
  // A missing image must not break previews: pairs that failed are listed above.
  if (failed.length > written / 10) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
