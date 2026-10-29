// Build-time files for answer engines and data users. Run after `vite build`:
//   dist/llms.txt                   — what the site is, how URLs work, key pages (llmstxt.org format)
//   dist/llms-full.txt              — every documented shift as plain Markdown
//   dist/data/echodrift-atlas.json  — every shift in one file (the dataset download)
//   dist/data/echodrift-examples.csv — one row per word example
//
// Usage: npx tsx scripts/generate-llms.ts
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { SITE_ORIGIN } from '../src/seo/transformSeo';
import { transformSummary, primaryEffect } from '../src/utils/transformMeta';
import type { IPASymbol, Transformation } from '../src/data/loader';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const DATA = path.join(ROOT, 'public/data');

const readJson = <T>(p: string): T => JSON.parse(fs.readFileSync(p, 'utf8'));

const symbols = new Map<string, IPASymbol>(
  fs
    .readdirSync(path.join(DATA, 'symbols'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => readJson<IPASymbol>(path.join(DATA, 'symbols', f)))
    .map((s) => [s.id, s])
);

const shifts = fs
  .readdirSync(path.join(DATA, 'transformations'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => readJson<Transformation>(path.join(DATA, 'transformations', f)))
  .filter((t) => symbols.has(t.fromId) && symbols.has(t.toId) && t.languageExamples?.some((le) => le.examples?.length))
  .sort((a, b) => `${a.fromId}_to_${a.toId}`.localeCompare(`${b.fromId}_to_${b.toId}`));

const urlOf = (t: Transformation) => `${SITE_ORIGIN}/transform/${encodeURIComponent(t.fromId)}/${encodeURIComponent(t.toId)}`;
const pairOf = (t: Transformation) => `[${symbols.get(t.fromId)!.symbol}] → [${symbols.get(t.toId)!.symbol}]`;
const nameOf = (t: Transformation) => `${pairOf(t)}${primaryEffect(t) ? ' ' + primaryEffect(t) : ''}`;
const summaryOf = (t: Transformation) => transformSummary(symbols.get(t.fromId)!, symbols.get(t.toId)!, t);

const languages = new Set(shifts.flatMap((t) => t.languageExamples.map((le) => le.language)));
const families = new Set(shifts.flatMap((t) => t.languageExamples.map((le) => le.languageFamily).filter(Boolean)));
const landmarks = shifts.filter((t) => t.commonality === 5).sort((a, b) => nameOf(a).localeCompare(nameOf(b)));

// Process hubs worth listing: tags that are not language families, by size.
const tagCount = new Map<string, number>();
for (const t of shifts) for (const tag of t.tags || []) if (!families.has(tag)) tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
const processes = [...tagCount].filter(([, n]) => n >= 5).sort((a, b) => b[1] - a[1]).slice(0, 25);

const ABOUT = `EchoDrift is a free, open atlas of phonetic shifts: sound changes and allophones documented across world languages. Each entry is one from→to change between two IPA sounds, with word examples from attested ancestor and descendant stages, the language family, certainty and commonality scores (1–5) and the sources the examples were checked against.`;

const llms = `# EchoDrift — Atlas of Phonetic Shifts

> ${ABOUT} It currently covers ${shifts.length} documented shifts in ${languages.size} languages from ${families.size} families and branches.

How the data is organised:

- One page per shift: \`${SITE_ORIGIN}/transform/<from>/<to>\`, where <from> and <to> are symbol ids (e.g. \`/transform/p/f\` is [p] → [f]). Its first paragraph is a one-sentence summary.
- Hubs list the shifts of one language (\`/language/<name>\`), language family (\`/family/<name>\`) or process (\`/process/<name>\`).
- Each example's "from" form is the attested ancestor (a proto-form or older stage), never a sister language. Cells only hold one-step changes; chains with an attested intermediate stage are split.
- Certainty 5 means textbook-standard, 1 means contested. Commonality 5 means found in many unrelated families, 1 means one language or family.

## Key pages

- [IPA matrix](${SITE_ORIGIN}/): every documented from→to pair on one grid
- [Landmark sound changes](${SITE_ORIGIN}/landmarks): the ${landmarks.length} most widespread shifts
- [All transformations](${SITE_ORIGIN}/directory): the full list, grouped by source sound
- [Language families](${SITE_ORIGIN}/families)
- [Glossary](${SITE_ORIGIN}/glossary): phonetic process terms (lenition, palatalization, …)
- [Methodology and about](${SITE_ORIGIN}/about)
- [Bibliography](${SITE_ORIGIN}/sources)

## Data

- [All shifts as Markdown](${SITE_ORIGIN}/llms-full.txt): every entry with summary, examples and sources
- [All shifts as JSON](${SITE_ORIGIN}/data/echodrift-atlas.json): one array, same fields as the per-shift files
- [All word examples as CSV](${SITE_ORIGIN}/data/echodrift-examples.csv): one row per example
- [Source repository](https://github.com/komapc/phonomorph): per-shift JSON in \`public/data/transformations/\`, open to corrections

## Landmark sound changes

${landmarks.map((t) => `- [${nameOf(t)}](${urlOf(t)}): ${summaryOf(t)}`).join('\n')}

## Processes

${processes.map(([tag, n]) => `- [${tag}](${SITE_ORIGIN}/process/${encodeURIComponent(tag)}): ${n} shifts`).join('\n')}

## Optional

- [Atlas health](${SITE_ORIGIN}/stats): coverage statistics
`;

const md = (s: string) => s.replace(/\s+/g, ' ').trim();
const full = [
  `# EchoDrift — all ${shifts.length} documented phonetic shifts\n\n> ${ABOUT}\n\nSource: ${SITE_ORIGIN}/ · Data: ${SITE_ORIGIN}/data/echodrift-atlas.json`,
  ...shifts.map((t) =>
    [
      `## ${nameOf(t)}`,
      `URL: ${urlOf(t)}  \nCertainty: ${t.certainty}/5 · Commonality: ${t.commonality}/5${t.phoneticEffects ? `  \nEffects: ${t.phoneticEffects}` : ''}`,
      summaryOf(t),
      t.preamble ? md(t.preamble) : '',
      t.languageExamples
        .map((le) =>
          [
            `### ${le.language}${le.languageFamily ? ` (${le.languageFamily})` : ''}${le.isAllophone ? ' — allophone' : ''}`,
            ...le.examples.map((ex) => `- ${md(ex.from)} → ${md(ex.to)}${ex.note ? ` — ${md(ex.note)}` : ''}`),
          ].join('\n')
        )
        .join('\n\n'),
      t.sources?.length ? `Sources:\n${t.sources.map((s) => `- ${md(s)}`).join('\n')}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')
  ),
].join('\n\n');

const atlas = {
  name: 'EchoDrift atlas of phonetic shifts',
  url: SITE_ORIGIN,
  generated: new Date().toISOString().slice(0, 10),
  count: shifts.length,
  shifts: shifts.map((t) => ({
    id: `${t.fromId}_to_${t.toId}`,
    url: urlOf(t),
    from: { id: t.fromId, symbol: symbols.get(t.fromId)!.symbol, name: symbols.get(t.fromId)!.name },
    to: { id: t.toId, symbol: symbols.get(t.toId)!.symbol, name: symbols.get(t.toId)!.name },
    summary: summaryOf(t),
    ...t,
  })),
};

const csvCell = (v: unknown) => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csvRows = [
  ['shift_id', 'from_ipa', 'to_ipa', 'language', 'language_family', 'is_allophone', 'from_form', 'to_form', 'note', 'certainty', 'commonality', 'url'],
];
for (const t of shifts) {
  for (const le of t.languageExamples) {
    for (const ex of le.examples) {
      csvRows.push([
        `${t.fromId}_to_${t.toId}`,
        symbols.get(t.fromId)!.symbol,
        symbols.get(t.toId)!.symbol,
        le.language,
        le.languageFamily || '',
        le.isAllophone ? 'true' : 'false',
        ex.from,
        ex.to,
        ex.note || '',
        String(t.certainty),
        String(t.commonality),
        urlOf(t),
      ]);
    }
  }
}

fs.mkdirSync(path.join(DIST, 'data'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'llms.txt'), llms);
fs.writeFileSync(path.join(DIST, 'llms-full.txt'), full + '\n');
fs.writeFileSync(path.join(DIST, 'data/echodrift-atlas.json'), JSON.stringify(atlas));
fs.writeFileSync(path.join(DIST, 'data/echodrift-examples.csv'), csvRows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n');
console.log(`llms.txt: ${landmarks.length} landmarks; llms-full.txt + atlas JSON: ${shifts.length} shifts; CSV: ${csvRows.length - 1} examples`);
