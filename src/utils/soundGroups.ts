import type { IPASymbol } from '../data/loader';

/**
 * Fine-grained visibility toggles for the Home matrix.
 *
 * "Rare" groups split the old single Exotic toggle by sound type. They govern
 * only exotic symbols that carry no class flag; class symbols (palatalized,
 * nasalized, diphthong, aspirated) are decided by their class toggle alone,
 * exactly as before, so `?exotic=true` keeps rendering the same matrix.
 */
export const RARE_GROUPS = [
  { id: 'ejective', label: 'Ejectives', hint: 'Glottalic egressive stops and affricates: kʼ, tʼ, tsʼ, qʼ' },
  { id: 'implosive', label: 'Implosives', hint: 'Glottalic ingressive stops: ɓ, ɗ' },
  { id: 'click', label: 'Clicks', hint: 'Velaric ingressive consonants: ǃ' },
  { id: 'retroflex', label: 'Retroflexes', hint: 'Tongue tip curled back: ʈ, ɖ, ʂ, ʐ, ɳ, ɭ' },
  { id: 'pharyngeal', label: 'Pharyngeals', hint: 'Pharyngeal and pharyngealized (emphatic) consonants: ʕ, sˤ, tˤ' },
  { id: 'labialized', label: 'Labialized', hint: 'Consonants with lip rounding: kʷ, gʷ' },
  { id: 'alveolopalatal', label: 'Alveolo-palatals', hint: 'ɕ, ʑ, tɕ, dʑ' },
  { id: 'other', label: 'Other rare', hint: 'Less common sounds without a group of their own: β, ɦ, ʎ, ɹ, ʁ, ʊ' },
] as const;

export type RareGroupId = typeof RARE_GROUPS[number]['id'];
export const ALL_RARE: readonly RareGroupId[] = RARE_GROUPS.map(g => g.id);

export const CLASS_GROUPS = [
  { id: 'pal', flag: 'isPalatalized', label: 'Palatalized', hint: 'Consonants with a secondary [j]-like articulation: tʲ, bʲ, kʲ' },
  { id: 'asp', flag: 'isAspirated', label: 'Aspirated', hint: 'Aspirated and breathy-voiced stops: pʰ, tʰ, bʱ' },
  { id: 'nas', flag: 'isNasalized', label: 'Nasal vowels', hint: 'Nasalized vowels: ã, ẽ, õ' },
  { id: 'dip', flag: 'isDiphthong', label: 'Diphthongs', hint: 'Two-part vowels: ai, au, ie, uo' },
] as const;

export type ClassGroupId = typeof CLASS_GROUPS[number]['id'];
export type ClassToggles = Record<ClassGroupId, boolean>;

export const isClassSymbol = (s: IPASymbol) =>
  CLASS_GROUPS.some(g => s[g.flag]);

/** Which rare group an exotic symbol belongs to. */
export const rareGroupOf = (s: IPASymbol): RareGroupId => {
  if (s.manner === 'Ejective') return 'ejective';
  if (s.manner === 'Implosive') return 'implosive';
  if (s.manner === 'Click') return 'click';
  if (s.place === 'Retroflex') return 'retroflex';
  if (s.place === 'Pharyngeal' || s.id.endsWith('_pharyngealized') || s.symbol.includes('ˤ')) return 'pharyngeal';
  if (s.id.endsWith('_labialized') || s.symbol.includes('ʷ')) return 'labialized';
  if (s.place === 'Alveolo-palatal') return 'alveolopalatal';
  return 'other';
};

/**
 * Whether the special toggles allow this symbol. Class flags win: a class
 * symbol is shown iff all of its class toggles are on. Other exotic symbols
 * need their rare group enabled. Everything else is always allowed.
 */
export const isSymbolToggledOn = (
  s: IPASymbol,
  rare: ReadonlySet<RareGroupId>,
  classes: ClassToggles
) => {
  if (isClassSymbol(s)) return CLASS_GROUPS.every(g => !s[g.flag] || classes[g.id]);
  if (s.isExotic) return rare.has(rareGroupOf(s));
  return true;
};

/** `exotic=true` (legacy, all groups) or a comma list of group ids. */
export const parseRareParam = (value: string | null): Set<RareGroupId> => {
  if (!value) return new Set();
  if (value === 'true') return new Set(ALL_RARE);
  const wanted = new Set(value.split(','));
  return new Set(ALL_RARE.filter(id => wanted.has(id)));
};

/** Inverse of parseRareParam, in a stable order; null means "drop the param". */
export const serializeRareParam = (rare: ReadonlySet<RareGroupId>): string | null => {
  if (rare.size === 0) return null;
  if (ALL_RARE.every(id => rare.has(id))) return 'true';
  return ALL_RARE.filter(id => rare.has(id)).join(',');
};
