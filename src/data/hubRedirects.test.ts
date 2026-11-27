import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// public/data/hub-redirects.json maps old hub paths (merged labels that got search
// impressions) to the page that replaced them; scripts/prerender.ts writes a
// meta-refresh stub for each. A stub never replaces a live hub, so an old name
// that is still used as a label silently gets no redirect.
// Reads the transformation files, not the generated index: CI runs the tests
// before `npm run build` (rebuild-index).
const DATA = join(__dirname, '../../public/data');
const TRANSFORMATIONS = join(DATA, 'transformations');
const redirects: Record<string, string> = JSON.parse(readFileSync(join(DATA, 'hub-redirects.json'), 'utf8'));

const languages = new Set<string>();
const families = new Set<string>();
const tags = new Set<string>();
for (const f of readdirSync(TRANSFORMATIONS).filter((f) => f.endsWith('.json'))) {
  const t = JSON.parse(readFileSync(join(TRANSFORMATIONS, f), 'utf8'));
  for (const le of t.languageExamples || []) {
    if (le.language) languages.add(le.language.trim());
    if (le.languageFamily) families.add(le.languageFamily);
  }
  for (const tag of t.tags || []) tags.add(tag);
}
// Same derivation as scripts/rebuild-index.ts (languages) and prerender.ts (family
// hub = a tag that is a family; process hub = any other tag).
const live = (p: string) => {
  const [mode, name] = p.split('/');
  if (mode === 'language') return languages.has(name);
  if (mode === 'family') return tags.has(name) && families.has(name);
  if (mode === 'process') return tags.has(name) && !families.has(name);
  return false;
};
// Content pages prerendered at /<name> (scripts/prerender.ts, `statics`).
const STATIC_PAGES = new Set(['about', 'glossary', 'families', 'laws']);

describe('hub redirects', () => {
  it.each(Object.keys(redirects))('%s is no longer a live hub', (oldPath) => {
    expect(live(oldPath)).toBe(false);
  });

  it.each(Object.entries(redirects))('%s points at an existing page (%s)', (_, newPath) => {
    expect(newPath.includes('/') ? live(newPath) : STATIC_PAGES.has(newPath)).toBe(true);
  });
});
