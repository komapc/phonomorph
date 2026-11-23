// The `language` field of an entry is free text that names the lect where the
// change is observed, often with a qualifier: "Proto-Nakh to Ingush",
// "Swabian (Horb)", "Proto-East-Cushitic to Oromo, Konso and Arbore",
// "Nuu-chah-nulth m̓ ~ Makah b (correspondence)". languageNames() derives the
// plain language name(s) from it for the dataset CSV and for language counts.
// The raw field stays as is: it keys the /language/* hubs.
//
// Rule: keep the borrowing language of "X loans in Y", the outcome side of a
// correspondence ("A ~ B"), the descendant side of "A to B"; drop
// parenthetical qualifiers and a trailing "dialects"/"varieties"/"languages";
// split lists. Names are merged only where the labels themselves equate them
// (spelling variants in `aliases`); dialect-versus-language decisions are not
// made here. LANGUAGE_OVERRIDES in src/data/languageNames.ts holds the labels
// the rule gets wrong.
import { LANGUAGE_ALIASES as ALIASES, LANGUAGE_OVERRIDES as OVERRIDES } from '../data/languageNames';

const unique = (xs: string[]) => [...new Set(xs)];

// IPA segments and other lowercase tokens after the name in a correspondence:
// "Upriver Halkomelem y", "Adyghe and Kabardian ʔ". A name may start with a click
// letter before the capital (ǃXóõ); a bare click (ǃ) is a segment.
const dropTrailingSegments = (s: string) => {
  const words = s.split(' ');
  while (words.length > 1 && !/^[ǀǁǂǃ]?\p{Lu}/u.test(words[words.length - 1])) words.pop();
  return words.join(' ');
};

// Innermost groups first, so "A (B (C)) D" loses the whole qualifier; stray
// parentheses left by unbalanced labels are dropped.
const stripParens = (s: string) => {
  let prev;
  do {
    prev = s;
    s = s.replace(/\([^()]*\)/g, ' ');
  } while (s !== prev);
  return s.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
};

export function languageNames(raw: string): string[] {
  const o = OVERRIDES[raw];
  let names: string[];
  if (o) names = o;
  else {
    let s = stripParens(raw);
    if (s.includes('~')) s = dropTrailingSegments(s.split('~').pop()!.trim());
    const loans = s.match(/\bloan(?:word)?s? in (.+)$/i);
    if (loans) s = loans[1];
    const parts = s.split(/\s+to\s+/i);
    s = parts[parts.length - 1];
    names = s
      .split(/\s*(?:,|\/|;|\s&\s|\sand\s)\s*/)
      .map((x) => x.replace(/\s+(?:dialects?|varieties|languages)$/i, '').trim())
      .filter(Boolean);
    if (!names.length) names = [raw.trim()];
  }
  return unique(names.map((n) => ALIASES[n] ?? n));
}
