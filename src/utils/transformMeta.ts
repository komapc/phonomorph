// Title / meta description for a transformation page. Shared by the SPA
// (TransformationPage.tsx, via react-helmet) and the crawler middleware
// (functions/_middleware.js) so Googlebot sees the same text before and after
// it executes the bundle.

interface LanguageExampleLike {
  language?: string;
  examples?: unknown[];
}

interface TransformationLike {
  phoneticEffects?: string;
  preamble?: string;
  languageExamples?: LanguageExampleLike[];
}

// The `language` field is free text ("Latin to Romance", "Russian / Slavic",
// "English (some dialects)", "Various"). It also keys /language/* hub URLs, so
// the data stays as is; this only derives a short display name for titles.
export function displayLanguage(raw: string | undefined): string | null {
  if (!raw) return null;
  let s = raw.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s || /^various\b/i.test(s)) return null;
  // "Latin to French" → "French"; "Proto-Slavic to various Slavic languages" → "Proto-Slavic"
  const to = s.split(/\s+to\s+/i);
  if (to.length === 2) s = /^various\b/i.test(to[1]) ? to[0] : to[1];
  // "Russian / Slavic" → "Russian"
  s = s.split(/\s*\/\s*/)[0].trim();
  return s || null;
}

export function attestedLanguages(t: TransformationLike): string[] {
  const out: string[] = [];
  for (const le of t.languageExamples || []) {
    const name = displayLanguage(le.language);
    if (name && !out.includes(name)) out.push(name);
  }
  return out;
}

export function hasExamples(t: TransformationLike): boolean {
  return (t.languageExamples || []).some((le) => (le.examples || []).length > 0);
}

function joinNatural(items: string[], max: number): string {
  if (items.length <= max) {
    return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
  }
  const rest = items.length - max;
  return `${items.slice(0, max).join(', ')} and ${rest} more language${rest > 1 ? 's' : ''}`;
}

export function clampText(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

// "[n] → [nʲ] Palatalization in Russian +1 | EchoDrift" — one language keeps
// most titles inside the ~60 chars Google displays.
export function transformTitle(pair: string, t: TransformationLike): string {
  const effect = (t.phoneticEffects || '').split(',')[0].trim();
  const langs = attestedLanguages(t);
  const lang = langs.length ? ` in ${langs[0]}${langs.length > 1 ? ` +${langs.length - 1}` : ''}` : '';
  return `${pair}${effect ? ' ' + effect : ''}${lang} | EchoDrift`;
}

export function transformDescription(pair: string, t: TransformationLike): string {
  const effect = (t.phoneticEffects || '').split(',')[0].trim();
  const langs = attestedLanguages(t);
  const head = `${pair}${effect ? ' ' + effect.toLowerCase() : ''}${langs.length ? ', attested in ' + joinNatural(langs, 3) : ''}.`;
  return clampText(`${head} ${t.preamble || ''}`, 158);
}
