import { useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { IPASymbol, IPASymbolMeta } from '../data/loader';

export interface SymbolGroup extends IPASymbolMeta {
  isGroup: true;
  originalSymbols: IPASymbol[];
}

export type MatrixSymbol = (IPASymbol & { isZero?: boolean }) | SymbolGroup;

/**
 * Hook for managing matrix filters from URL query parameters
 */
export const useMatrixFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryFilter = (searchParams.get('category') || 'all') as 'all' | 'vowel' | 'consonant';
  const mannerFilter = searchParams.get('manner') || 'all';
  const placeFilter = searchParams.get('place') || 'all';
  const heightFilter = searchParams.get('height') || 'all';
  const backnessFilter = searchParams.get('backness') || 'all';
  const familyFilter = searchParams.get('family') || 'all';
  const languageFilter = searchParams.get('language') || 'all';
  const voicedFilter = searchParams.get('voiced') || 'all';
  const matrixMode = (searchParams.get('mode') || 'symmetric') as 'symmetric' | 'v2c' | 'c2v';
  const collapseMode = (searchParams.get('collapse') || 'none') as 'none' | 'manner' | 'place' | 'height' | 'backness';

  const setFilter = useCallback((key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all' || value === 'symmetric') newParams.delete(key);
    else newParams.set(key, value);
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

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
    searchParams,
    setSearchParams
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
    showExotic: boolean;
    showPalatalized: boolean;
    showNasalized: boolean;
    showDiphthongs: boolean;
    showAspirated: boolean;
  }
) => {
  return useMemo(() => {
    return symbols.filter(s => {
      const typeMatch = filters.categoryFilter === 'all' || s.category === filters.categoryFilter;
      const mannerMatch = filters.mannerFilter === 'all' || s.manner === filters.mannerFilter;
      const placeMatch = filters.placeFilter === 'all' || s.place === filters.placeFilter;
      const heightMatch = filters.heightFilter === 'all' || s.height === filters.heightFilter;
      const backnessMatch = filters.backnessFilter === 'all' || s.backness === filters.backnessFilter;
      const familyMatch = filters.familyFilter === 'all' || s.family === filters.familyFilter;

      let voicedMatch = true;
      if (filters.voicedFilter !== 'all') {
        const isVoiced = s.name.toLowerCase().includes('voiced');
        voicedMatch = filters.voicedFilter === 'true' ? isVoiced : !isVoiced;
      }

      // Visibility logic for special classes
      if (s.isPalatalized && !filters.showPalatalized) return false;
      if (s.isNasalized && !filters.showNasalized) return false;
      if (s.isDiphthong && !filters.showDiphthongs) return false;
      if (s.isAspirated && !filters.showAspirated) return false;

      // Exotic filter: only hides sounds that are NOT in a toggled special class
      const isSpecialActive = (s.isPalatalized && filters.showPalatalized) || (s.isNasalized && filters.showNasalized) || (s.isDiphthong && filters.showDiphthongs) || (s.isAspirated && filters.showAspirated);
      if (s.isExotic && !filters.showExotic && !isSpecialActive) return false;

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

    return groupSymbols(base);
  }, [matrixMode, filteredSymbols, groupSymbols]);

  const colSymbols = useMemo(() => {
    let base: (IPASymbol & { isZero?: boolean })[];
    if (matrixMode === 'v2c') base = filteredSymbols.filter(s => s.category === 'consonant' || (s as { isZero?: boolean }).isZero) as (IPASymbol & { isZero?: boolean })[];
    else if (matrixMode === 'c2v') base = filteredSymbols.filter(s => s.category === 'vowel' || (s as { isZero?: boolean }).isZero) as (IPASymbol & { isZero?: boolean })[];
    else base = filteredSymbols as (IPASymbol & { isZero?: boolean })[];

    return groupSymbols(base);
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

/**
 * Hook for syncing special display toggles with URL
 */
export const useSyncSpecialFiltersToURL = (
  showExotic: boolean,
  showPalatalized: boolean,
  showNasalized: boolean,
  showDiphthongs: boolean,
  showAspirated: boolean,
  collapseMode: string,
  searchParams: URLSearchParams,
  setSearchParams: (params: URLSearchParams) => void
) => {
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (showExotic) newParams.set('exotic', 'true'); else newParams.delete('exotic');
    if (showPalatalized) newParams.set('pal', 'true'); else newParams.delete('pal');
    if (showNasalized) newParams.set('nas', 'true'); else newParams.delete('nas');
    if (showDiphthongs) newParams.set('dip', 'true'); else newParams.delete('dip');
    if (showAspirated) newParams.set('asp', 'true'); else newParams.delete('asp');
    if (collapseMode !== 'none') newParams.set('collapse', collapseMode); else newParams.delete('collapse');
    setSearchParams(newParams);
  }, [showExotic, showPalatalized, showNasalized, showDiphthongs, showAspirated, collapseMode, searchParams, setSearchParams]);
};
