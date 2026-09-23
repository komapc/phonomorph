// Normalize transformation `tags`. Every tag that isn't a language family
// becomes a /process/<tag> hub, so spelling variants ("Vowel Shift" /
// "Vowel shift" / "Vowel-Shift") split one hub into near-duplicates, and
// language names ("Arabic") or placeholders ("Various") produce hubs that
// aren't phonetic processes at all. Old hub URLs are 301'd to the canonical
// one by functions/_middleware.js (canonicalHub).
//
//   npx tsx scripts/normalize-tags.ts          # dry run
//   npx tsx scripts/normalize-tags.ts --write
//   npx tsx scripts/normalize-tags.ts --check  # CI: exit 1 if anything would change
import fs from 'node:fs';
import path from 'node:path';
import { tagKey } from '../src/utils/tagKey';

const DIR = path.join(import.meta.dirname, '..', 'public/data/transformations');
const write = process.argv.includes('--write');
const check = process.argv.includes('--check');

// Placeholders that describe nothing.
const DROP = new Set(['various', 'na', 'multiple', 'diverse', 'global', 'universal']);

// Language / variety names used as tags. They have their own /language/* hubs
// (from languageExamples), so as tags they only create mislabeled process hubs.
const LANGUAGE_TAGS = new Set(
  [
    'Arabic', 'Spanish', 'Vietnamese', 'French', 'Thai', 'Middle Chinese', 'Russian', 'Japanese',
    'Sanskrit', 'Nahuatl', 'Latin', 'English Dialects', 'Mandarin', 'Portuguese', 'Old French',
    'Old English', 'Ancient Greek', 'Sardinian', 'North American English', 'Middle English',
    'Akkadian', 'Zapotec', 'Walloon', 'Ukrainian', 'Tlingit', 'Sumerian', 'Sino-Korean', 'Sindarin',
    'Scots', 'Sasaknese', 'Proto-Algonquian', 'Phoenician', 'Persian', 'Old Spanish', 'Old Irish',
    'Occitan', 'Modern Greek', 'Malay', 'Lycian', 'Kurdish', 'Korean', 'Italian', 'Irish',
    'Indonesian-Aceh dialect', 'Igala', 'Hungarian', 'Hindustani', 'Haroi', 'Gullah', 'Gothic',
    'Faroese', 'Coptic', 'Cantonese', 'Aramaic', 'Amharic', 'American English', 'Akan', 'Afrikaans',
    'AAVE', 'North American', 'English',
  ].map(tagKey)
);

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json'));
const data = files.map((f) => ({ f, t: JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')) }));

// Canonical spelling per key, chosen among spellings already in use: the
// unhyphenated "De…" form (matches Deaffrication, Depalatalization), then
// Title Case (house style), then the most frequent.
const spellings = new Map<string, Map<string, number>>();
for (const { t } of data) {
  for (const tag of t.tags || []) {
    const m = spellings.get(tagKey(tag)) || new Map<string, number>();
    m.set(tag, (m.get(tag) || 0) + 1);
    spellings.set(tagKey(tag), m);
  }
}
const isTitleCase = (s: string) => s.split(/[\s-]+/).every((w) => /^[A-Z0-9]/.test(w) || /^(of|to|and|in)$/.test(w));
const score = (s: string, n: number) => (/^De[a-z]/.test(s) ? 1e6 : 0) + (isTitleCase(s) ? 1e4 : 0) + (s.includes('-') ? 0 : 1e3) + n;
const canonical = new Map<string, string>();
for (const [key, m] of spellings) {
  canonical.set(key, [...m].sort((a, b) => score(b[0], b[1]) - score(a[0], a[1]))[0][0]);
}

let changed = 0;
for (const { f, t } of data) {
  if (!Array.isArray(t.tags)) continue;
  const next: string[] = [];
  for (const tag of t.tags as string[]) {
    const key = tagKey(tag);
    if (DROP.has(key) || LANGUAGE_TAGS.has(key)) continue;
    const c = canonical.get(key)!;
    if (!next.includes(c)) next.push(c);
  }
  if (JSON.stringify(next) === JSON.stringify(t.tags)) continue;
  changed++;
  if (!write) {
    console.log(`${f}: ${JSON.stringify(t.tags)} → ${JSON.stringify(next)}`);
    continue;
  }
  const raw = fs.readFileSync(path.join(DIR, f), 'utf8');
  // Rewrite only the tags array, keeping the file's own formatting elsewhere.
  const re = /"tags"\s*:\s*\[[^\]]*\]/;
  const m = raw.match(re);
  if (!m) throw new Error(`${f}: tags array not found`);
  const multiline = m[0].includes('\n');
  const indent = (raw.slice(0, m.index).split('\n').pop() || '').match(/^\s*/)![0];
  const arr = multiline
    ? `[\n${next.map((x) => `${indent}  ${JSON.stringify(x)}`).join(',\n')}\n${indent}]`
    : `[${next.map((x) => JSON.stringify(x)).join(', ')}]`;
  fs.writeFileSync(path.join(DIR, f), raw.replace(re, `"tags": ${next.length ? arr : '[]'}`));
}
console.log(`${changed} files ${write ? 'updated' : 'to update'}`);
if (check && changed) process.exit(1);
