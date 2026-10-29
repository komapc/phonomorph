// Title / meta description for a transformation page. Shared by the SPA
// (TransformationPage.tsx, via react-helmet) and the crawler middleware
// (functions/_middleware.js) so Googlebot sees the same text before and after
// it executes the bundle.

interface ExampleLike {
  from?: string;
  to?: string;
}

interface LanguageExampleLike {
  language?: string;
  languageFamily?: string;
  isAllophone?: boolean;
  examples?: ExampleLike[];
}

interface SymbolLike {
  symbol: string;
  name: string;
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
  // "Russian / Slavic" → "Russian"; "Creek, Koasati, Alabama" → "Creek"
  s = s.split(/\s*[/,]\s*/)[0].trim();
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
  if (t.length <= max) return t;
  // Prefer ending on a whole sentence, then on a whole word, so snippets never stop mid-word.
  const head = t.slice(0, max);
  const sentenceEnd = head.lastIndexOf('. ');
  if (sentenceEnd >= max * 0.6) return head.slice(0, sentenceEnd + 1);
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd().replace(/[,;:\-–—]+$/, '') + '…';
}

// Effects are a comma list ("Rounding, Raising, Iotacism"). A named process
// (Iotacism, Grimm's Law, Great Vowel Shift) is what people search for, so it
// leads the title even when it is not listed first.
export function primaryEffect(t: TransformationLike): string {
  const effects = (t.phoneticEffects || '').split(',').map((e) => e.trim()).filter(Boolean);
  const named = effects.find((e) => /ism$|\blaw$|\bshift$/i.test(e));
  return named || effects[0] || '';
}

// What kind of change this is, by its entries: "sound change", "allophone" or both.
export function changeKind(t: TransformationLike): string {
  const entries = t.languageExamples || [];
  const allo = entries.filter((le) => le.isAllophone).length;
  if (allo && allo === entries.length) return 'allophone';
  return allo ? 'sound change and allophone' : 'sound change';
}

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

// "[n] → [nʲ] Palatalization: Sound Change in Russian +1 | EchoDrift". The
// named process leads (people search "Grimm's law"); "sound change" matches
// how the rest search ("p to f sound change").
export function transformTitle(pair: string, t: TransformationLike): string {
  const effect = primaryEffect(t);
  const langs = attestedLanguages(t);
  const lang = langs.length ? ` in ${langs[0]}${langs.length > 1 ? ` +${langs.length - 1}` : ''}` : '';
  const title = `${pair}${effect ? ' ' + effect + ':' : ''} ${titleCase(changeKind(t))}${lang}`;
  // Search results show ~60–70 chars and add the site name themselves when the title has none.
  return title.length > 58 ? title : `${title} | EchoDrift`;
}

const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;
const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);

// One self-contained, answer-first sentence: what the change is, how widely it
// is attested and one example. Leads the page and the meta description, and is
// the line answer engines quote.
export function transformSummary(from: SymbolLike, to: SymbolLike, t: TransformationLike, short = false): string {
  const effect = primaryEffect(t);
  const name = effect && !/\b(law|shift)$/i.test(effect) ? effect.toLowerCase() : effect;
  const entries = t.languageExamples || [];
  const langs = attestedLanguages(t);
  const families = [...new Set(entries.map((le) => le.languageFamily).filter(Boolean))];
  const kind = changeKind(t);
  const what =
    kind === 'allophone'
      ? `allophonic ${name || 'variation'}`
      : `${name ? name + ' ' : ''}sound change${kind === 'sound change' ? '' : ' (also allophonic)'}`;
  const names = short ? '' : ` (${lowerFirst(from.name)} to ${lowerFirst(to.name)})`;
  let s = `[${from.symbol}] → [${to.symbol}]${names} is ${/^[aeiou]/i.test(what) ? 'an' : 'a'} ${what}`;
  if (langs.length) {
    s += ` documented in ${plural(langs.length, 'language')}`;
    if (families.length > 1) s += ` from ${families.length} families and branches`;
  }
  const le = !short ? entries.find((e) => e.examples?.some((x) => x.from && x.to)) : undefined;
  const ex = le?.examples?.find((x) => x.from && x.to);
  if (ex) {
    const lang = displayLanguage(le!.language);
    s += `, e.g. ${ex.from} → ${ex.to}${lang ? ` (${lang})` : ''}`;
  }
  return s + '.';
}

export function transformDescription(pair: string, t: TransformationLike, from?: SymbolLike, to?: SymbolLike): string {
  if (from && to && hasExamples(t)) return clampText(`${transformSummary(from, to, t, true)} ${t.preamble || ''}`, 158);
  const effect = primaryEffect(t);
  const langs = attestedLanguages(t);
  const head = `${pair}${effect ? ' ' + effect.toLowerCase() : ''}${langs.length ? ', attested in ' + joinNatural(langs, 3) : ''}.`;
  return clampText(`${head} ${t.preamble || ''}`, 158);
}
