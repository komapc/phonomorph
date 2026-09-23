// Normalize `phoneticEffects` to the house style: comma-separated Title Case
// process terms, no parenthetical glosses, no prose. Titles and meta
// descriptions are built from the first term, so prose here leaks into SERPs.
//
//   npx tsx scripts/normalize-effects.ts          # dry run
//   npx tsx scripts/normalize-effects.ts --write
//   npx tsx scripts/normalize-effects.ts --check  # CI: exit 1 if anything would change
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(import.meta.dirname, '..', 'public/data/transformations');
const write = process.argv.includes('--write');
const check = process.argv.includes('--check');

const SMALL = new Set(['of', 'to', 'and', 'in', 'the', 'a']);
const titleCase = (s: string) =>
  s
    .split(' ')
    .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');

const isProse = (s: string) => /^(This|The|A|An|It)\b/.test(s) || s.split(' ').length > 5 || /\*\*|:|;/.test(s);

function splitTerms(effects: string): string[] {
  return effects
    .replace(/\([^)]*\)/g, ' ')
    .split(/,|\band\b|\//)
    .map((t) => t.replace(/\s+/g, ' ').trim().replace(/\.$/, ''))
    .filter(Boolean);
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json'));
const data = files.map((f) => ({ f, t: JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')) }));

// Vocabulary: terms used in at least two well-formed entries (so fragments of
// prose that happened to sit between commas don't qualify). Longest first so
// "Vowel Raising" wins over "Raising".
const GENERIC = new Set(['shift', 'change', 'sound change', 'vowel shift', 'transformation']);
const counts = new Map<string, { tc: string; n: number }>();
for (const { t } of data) {
  const effects: string = t.phoneticEffects || '';
  if (!effects || effects.split(',').some((x) => isProse(x.trim()))) continue;
  for (const term of splitTerms(effects)) {
    if (term.length < 5 || term.length > 32 || !/^[A-Za-z][A-Za-z -]+$/.test(term)) continue;
    const key = term.toLowerCase();
    if (GENERIC.has(key)) continue;
    const c = counts.get(key) || { tc: titleCase(term), n: 0 };
    c.n++;
    counts.set(key, c);
  }
}
const vocab = new Map([...counts].filter(([, c]) => c.n >= 2).map(([k, c]) => [k, c.tc]));
const vocabList = [...vocab.values()].sort((a, b) => b.length - a.length);

let changed = 0;
const unresolved: string[] = [];
for (const { f, t } of data) {
  const orig: string = t.phoneticEffects || '';
  if (!orig) continue;
  let terms: string[];
  if (isProse(orig.split(',')[0])) {
    // Pull known terms out of the sentence in order of appearance.
    const text = orig.replace(/\*\*/g, '').replace(/\([^)]*\)/g, ' ');
    const hits: { i: number; term: string }[] = [];
    let masked = text.toLowerCase();
    for (const term of vocabList) {
      const re = new RegExp(`\\b${term.toLowerCase().replace(/[-]/g, '[- ]?')}\\b`);
      const m = re.exec(masked);
      if (m) {
        hits.push({ i: m.index, term });
        masked = masked.slice(0, m.index) + ' '.repeat(m[0].length) + masked.slice(m.index + m[0].length);
      }
    }
    terms = hits.sort((a, b) => a.i - b.i).map((h) => h.term);
    if (!terms.length) { unresolved.push(`${f}\t${orig}`); continue; }
  } else {
    terms = splitTerms(orig).map(titleCase);
  }
  const next = [...new Set(terms)].slice(0, 5).join(', ');
  if (next !== orig) {
    changed++;
    if (!write) console.log(`${f}\n  - ${orig.slice(0, 140)}\n  + ${next}`);
    else {
      const raw = fs.readFileSync(path.join(DIR, f), 'utf8');
      const updated = raw.replace(JSON.stringify(orig).slice(1, -1), JSON.stringify(next).slice(1, -1));
      if (updated === raw) unresolved.push(`${f}\t(could not patch in place)`);
      else fs.writeFileSync(path.join(DIR, f), updated);
    }
  }
}
console.log(`${changed} to change${write ? ' (written)' : ''}; ${unresolved.length} unresolved`);
if (unresolved.length) console.log(unresolved.join('\n'));
if (check && (changed || unresolved.length)) process.exit(1);
