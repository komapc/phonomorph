export interface IPASymbol {
  id: string;
  symbol: string;
  name: string;
  category: 'vowel' | 'consonant';
  place?: string;
  manner?: string;
  family?: string;
  height?: string;
  backness?: string;
  isExotic?: boolean;
  isPalatalized?: boolean;
  isNasalized?: boolean;
  isDiphthong?: boolean;
  isAspirated?: boolean;
}

export interface RelatedTransformation {
  fromId: string;
  toId: string;
  label: string;
  type: 'chain' | 'branch';
}

export interface Transformation {
  fromId: string;
  toId: string;
  preamble: string;
  phoneticEffects: string;
  languageExamples: {
    language: string;
    languageFamily?: string;
    examples: { from: string; to: string; note?: string }[];
  }[];
  period?: string;
  certainty: 1 | 2 | 3 | 4 | 5;
  commonality: 1 | 2 | 3 | 4 | 5;
  sources: string[];
  tags: string[];
  related?: RelatedTransformation[];
}

export interface IPASymbolMeta {
  id: string;
  symbol: string;
  name: string;
  category: 'vowel' | 'consonant';
  place?: string;
  manner?: string;
  height?: string;
  backness?: string;
  family?: string;
  isExotic?: boolean;
  isPalatalized?: boolean;
  isNasalized?: boolean;
  isDiphthong?: boolean;
  isAspirated?: boolean;
}

export interface TransformationMeta {
  id: string;
  name: string;
  commonality: number;
  isAllophone?: boolean;
  languages?: string[];
}

export interface DataIndex {
  symbols: IPASymbolMeta[];
  transformations: TransformationMeta[];
  unattested: string[];
  stats: {
    totalExamples: number;
    totalSources: number;
    totalAllophones: number;
    families: string[];
    languages: string[];
  };
}

// In production on GitHub Pages, we need to respect the base path
const BASE_URL = import.meta.env.BASE_URL;

export const GITHUB_REPO = 'komapc/phonomorph';

/**
 * Retry logic for failed API calls with exponential backoff
 */
async function fetchWithRetry<T>(
  url: string,
  maxRetries: number = 2,
  initialDelay: number = 500
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Failed to fetch after retries');
}

export async function fetchDataIndex(): Promise<DataIndex> {
  try {
    return await fetchWithRetry<DataIndex>(`${BASE_URL}data/index.json`, 3, 500);
  } catch (err) {
    console.error('Failed to fetch data index:', err);
    throw new Error(
      'Could not load the phonetic transformation atlas. ' +
      'Please check your internet connection and try again.'
    );
  }
}

export async function fetchSymbol(id: string): Promise<IPASymbol | null> {
  try {
    return await fetchWithRetry<IPASymbol>(`${BASE_URL}data/symbols/${id}.json`, 2, 300);
  } catch (err) {
    console.warn(`Failed to fetch symbol ${id}:`, err);
    return null;
  }
}

export async function fetchTransformation(fromId: string, toId: string): Promise<Transformation | null> {
  try {
    return await fetchWithRetry<Transformation>(
      `${BASE_URL}data/transformations/${fromId}_to_${toId}.json`,
      2,
      300
    );
  } catch (err) {
    // Transformation not found is expected for undocumented shifts
    return null;
  }
}

export async function fetchAllSymbols(ids: string[]): Promise<IPASymbol[]> {
  const results = await Promise.allSettled(
    ids.map(id => fetchSymbol(id))
  );

  return results
    .map((result, idx) => {
      if (result.status === 'fulfilled' && result.value !== null) {
        return result.value;
      }
      console.warn(`Failed to load symbol at index ${idx}`);
      return null;
    })
    .filter((sym): sym is IPASymbol => sym !== null);
}
