import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { IPASymbol, IPASymbolMeta } from '../data/loader';
import { isSymbolToggledOn, voicingOf } from '../utils/soundGroups';
import type { ClassToggles, RareGroupId } from '../utils/soundGroups';

export interface SymbolGroup extends IPASymbolMeta {
  isGroup: true;
  originalSymbols: IPASymbol[];
}

export type MatrixSymbol = (IPASymbol & { isZero?: boolean }) | SymbolGroup;

/**
 * Linguistic Sort Order Maps
 */
const HEIGHT_ORDER = { 'close': 1, 'near-close': 2, 'close-mid': 3, 'mid': 4, 'open-mid': 5, 'near-open': 6, 'open': 7 };
const BACKNESS_ORDER = { 'front': 1, 'central': 2, 'back': 3 };
const MANNER_ORDER = { 'plosive': 1, 'nasal': 2, 'trill': 3, 'tap-flap': 4, 'flap': 4, 'tap': 4, 'fricative': 5, 'sibilant': 5, 'lateral-fricative': 6, 'affricate': 7, 'approximant': 8, 'lateral-approximant': 9, 'click': 10, 'implosive': 11, 'ejective': 12 };
const PLACE_ORDER = { 'bilabial': 1, 'labiodental': 2, 'linguolabial': 3, 'dental': 4, 'alveolar': 5, 'postalveolar': 6, 'retroflex': 7, 'alveolo-palatal': 8, 'palatal': 8, 'velar': 9, 'uvular': 10, 'pharyngeal': 11, 'epiglottal': 12, 'glottal': 13 };

// Symbol data uses Title case ('Plosive', 'Close-mid'); the maps are keyed in lower case.
const rank = (order: Record<string, number>, value?: string): number =>
  (value && order[value.toLowerCase()]) || 99;

// "unrounded" contains "rounded", so test for the negative first.
const isRounded = (s: IPASymbol): boolean => {
  const name = s.name.toLowerCase();
  return !name.includes('unrounded') && name.includes('rounded');
};

const sortSymbolsLinguistically = (a: MatrixSymbol, b: MatrixSymbol): number => {
  if ('isGroup' in a || 'isGroup' in b) return 0;
  const symA = a as IPASymbol;
  const symB = b as IPASymbol;

  if (symA.category === 'vowel' && symB.category === 'vowel') {
    const hA = rank(HEIGHT_ORDER, symA.height);
    const hB = rank(HEIGHT_ORDER, symB.height);
    if (hA !== hB) return hA - hB;
    const bA = rank(BACKNESS_ORDER, symA.backness);
    const bB = rank(BACKNESS_ORDER, symB.backness);
    if (bA !== bB) return bA - bB;
    // IPA chart order within a cell: unrounded before rounded (i y, e ø, ɯ u),
    // oral before nasalized, then by symbol for a stable order.
    const rA = isRounded(symA) ? 1 : 0;
    const rB = isRounded(symB) ? 1 : 0;
    if (rA !== rB) return rA - rB;
    const nA = symA.isNasalized ? 1 : 0;
    const nB = symB.isNasalized ? 1 : 0;
    if (nA !== nB) return nA - nB;
    return symA.symbol.localeCompare(symB.symbol);
  }

  if (symA.category === 'consonant' && symB.category === 'consonant') {
    const mA = rank(MANNER_ORDER, symA.manner);
    const mB = rank(MANNER_ORDER, symB.manner);
    if (mA !== mB) return mA - mB;
    const pA = rank(PLACE_ORDER, symA.place);
    const pB = rank(PLACE_ORDER, symB.place);
    if (pA !== pB) return pA - pB;
    
        // Voicing sort: unvoiced before voiced
    const isVoicedA = symA.name.toLowerCase().includes('voiced') && !symA.name.toLowerCase().includes('voiceless');
    const isVoicedB = symB.name.toLowerCase().includes('voiced') && !symB.name.toLowerCase().includes('voiceless');
    const vA = isVoicedA ? 1 : 0;
    const vB = isVoicedB ? 1 : 0;
    if (vA !== vB) return vA - vB;
    
    return symA.symbol.localeCompare(symB.symbol);
  }

  return symA.category === 'vowel' ? -1 : 1;
};

/** Default values are dropped from the URL. Category defaults to vowels, so 'all' is explicit there. */
export const isDefaultFilterValue = (key: string, value: string) =>
  key === 'category' ? value === 'vowel'
    : key === 'mode' ? value === 'symmetric'
    : key === 'collapse' ? value === 'none'
    : value === 'all' || value === '';

/** URL keys of the feature filters in the Filters panel (Reset clears these). */
export const FEATURE_FILTER_KEYS = ['manner', 'place', 'voiced', 'height', 'backness', 'language', 'mode'] as const;

/**
 * Hook for managing matrix filters from URL query parameters
 */
export const useMatrixFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryFilter = (searchParams.get('category') || 'vowel') as 'all' | 'vowel' | 'consonant';
  const mannerFilter = searchParams.get('manner') || 'all';
  const placeFilter = searchParams.get('place') || 'all';
  const heightFilter = searchParams.get('height') || 'all';
  const backnessFilter = searchParams.get('backness') || 'all';
  const familyFilter = searchParams.get('family') || 'all';
  const languageFilter = searchParams.get('language') || 'all';
  const voicedFilter = searchParams.get('voiced') || 'all';
  const matrixMode = (searchParams.get('mode') || 'symmetric') as 'symmetric' | 'v2c' | 'c2v';
  const collapseMode = (searchParams.get('collapse') || 'none') as 'none' | 'manner' | 'place' | 'height' | 'backness';

  // All matrix state lives in the URL, so Back/Forward and returning from a
  // shift page restore it. Writes replace the history entry: toggling a
  // checkbox should not add a Back step.
  const updateParams = useCallback((mutate: (p: URLSearchParams) => void) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      mutate(next);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setFilter = useCallback((key: string, value: string) => {
    updateParams(p => {
      if (isDefaultFilterValue(key, value)) p.delete(key);
      else p.set(key, value);
    });
  }, [updateParams]);

  return {
    categoryFilter,
    mannerFilter,
    placeFilter,
    heightFilter,
    backnessFilter,
    familyFilter,
    languageFilter,
    voicedFilter,
    matrixMode,
    collapseMode,
    setFilter,
    updateParams,
    searchParams,
  };
};

/**
 * Hook for managing symbol grouping by various properties
 */
export const useSymbolGrouping = (collapseMode: string) => {
  return useCallback((syms: (IPASymbol & { isZero?: boolean })[]): MatrixSymbol[] => {
    if (collapseMode === 'none') return syms;

    const groups: Record<string, IPASymbol[]> = {};
    syms.forEach(s => {
      const key = (s as unknown as Record<string, string>)[collapseMode] || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

    return Object.entries(groups).map(([name, members]) => ({
      id: name,
      symbol: name.substring(0, 3).toUpperCase(),
      name: `${name} (${members.length} sounds)`,
      category: members[0].category,
      isGroup: true,
      originalSymbols: members
    }) as SymbolGroup);
  }, [collapseMode]);
};

/**
 * Hook for filtering symbols based on all filter criteria
 */
export const useFilteredSymbols = (
  symbols: IPASymbol[],
  filters: ReturnType<typeof useMatrixFilters> & {
    rareGroups: ReadonlySet<RareGroupId>;
    classToggles: ClassToggles;
  }
) => {
  return useMemo(() => {
    return symbols.filter(s => {
      const typeMatch = filters.categoryFilter === 'all' || s.category === filters.categoryFilter;
      // Consonant features constrain only consonants and vowel features only
      // vowels, so in the "All" view a manner filter does not empty the vowels.
      const isC = s.category === 'consonant';
      const mannerMatch = !isC || filters.mannerFilter === 'all' || s.manner === filters.mannerFilter;
      const placeMatch = !isC || filters.placeFilter === 'all' || s.place === filters.placeFilter;
      const heightMatch = isC || filters.heightFilter === 'all' || s.height === filters.heightFilter;
      const backnessMatch = isC || filters.backnessFilter === 'all' || s.backness === filters.backnessFilter;
      const familyMatch = filters.familyFilter === 'all' || s.family === filters.familyFilter;

      const voicing = voicingOf(s);
      const voicedMatch = !voicing || filters.voicedFilter === 'all'
        || (filters.voicedFilter === 'true') === (voicing === 'voiced');

      if (!isSymbolToggledOn(s, filters.rareGroups, filters.classToggles)) return false;

      return typeMatch && mannerMatch && placeMatch && heightMatch && backnessMatch && voicedMatch && familyMatch;
    });
  }, [symbols, filters]);
};

/**
 * Hook for computing row/column symbols based on matrix mode
 */
export const useMatrixDimensions = (
  filteredSymbols: MatrixSymbol[],
  matrixMode: 'symmetric' | 'v2c' | 'c2v',
  groupSymbols: (syms: (IPASymbol & { isZero?: boolean })[]) => MatrixSymbol[]
) => {
  const rowSymbols = useMemo(() => {
    let base: (IPASymbol & { isZero?: boolean })[];
    if (matrixMode === 'v2c') base = filteredSymbols.filter(s => s.category === 'vowel' || (s as { isZero?: boolean }).isZero) as (IPASymbol & { isZero?: boolean })[];
    else if (matrixMode === 'c2v') base = filteredSymbols.filter(s => s.category === 'consonant' || (s as { isZero?: boolean }).isZero) as (IPASymbol & { isZero?: boolean })[];
    else base = filteredSymbols as (IPASymbol & { isZero?: boolean })[];

    const sorted = [...base].sort(sortSymbolsLinguistically);
    return groupSymbols(sorted);
  }, [matrixMode, filteredSymbols, groupSymbols]);

  const colSymbols = useMemo(() => {
    let base: (IPASymbol & { isZero?: boolean })[];
    if (matrixMode === 'v2c') base = filteredSymbols.filter(s => s.category === 'consonant' || (s as { isZero?: boolean }).isZero) as (IPASymbol & { isZero?: boolean })[];
    else if (matrixMode === 'c2v') base = filteredSymbols.filter(s => s.category === 'vowel' || (s as { isZero?: boolean }).isZero) as (IPASymbol & { isZero?: boolean })[];
    else base = filteredSymbols as (IPASymbol & { isZero?: boolean })[];

    const sorted = [...base].sort(sortSymbolsLinguistically);
    return groupSymbols(sorted);
  }, [matrixMode, filteredSymbols, groupSymbols]);

  return { rowSymbols, colSymbols };
};

/**
 * Hook for computing dropdown filter options
 */
export const useFilterOptions = (symbols: IPASymbol[]) => {
  const mannerOptions = useMemo(() => {
    const manners = new Set(symbols.map(s => s.manner).filter(Boolean));
    return Array.from(manners).sort() as string[];
  }, [symbols]);

  const placeOptions = useMemo(() => {
    const places = new Set(symbols.map(s => s.place).filter(Boolean));
    return Array.from(places).sort() as string[];
  }, [symbols]);

  const heightOptions = useMemo(() => {
    const heights = new Set(symbols.map(s => s.height).filter(Boolean));
    return Array.from(heights).sort() as string[];
  }, [symbols]);

  const backnessOptions = useMemo(() => {
    const backness = new Set(symbols.map(s => s.backness).filter(Boolean));
    return Array.from(backness).sort() as string[];
  }, [symbols]);

  const familyOptions = useMemo(() => {
    const families = new Set(symbols.map(s => s.family).filter(Boolean));
    return Array.from(families).sort() as string[];
  }, [symbols]);

  return {
    mannerOptions,
    placeOptions,
    heightOptions,
    backnessOptions,
    familyOptions
  };
};
