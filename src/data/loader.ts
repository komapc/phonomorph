export interface IPASymbol {
  id: string;
  symbol: string;
  name: string;
  category: 'vowel' | 'consonant';
  place?: string;
  manner?: string;
  height?: string;
  backness?: string;
  isExotic?: boolean;
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

export interface DataIndex {
  symbols: string[];
  transformations: string[];
}

// In production on GitHub Pages, we need to respect the base path
const BASE_URL = import.meta.env.BASE_URL;

export async function fetchDataIndex(): Promise<DataIndex> {
  const response = await fetch(`${BASE_URL}data/index.json`);
  return response.json();
}

export async function fetchSymbol(id: string): Promise<IPASymbol> {
  const response = await fetch(`${BASE_URL}data/symbols/${id}.json`);
  return response.json();
}

export async function fetchTransformation(fromId: string, toId: string): Promise<Transformation | null> {
  try {
    const response = await fetch(`${BASE_URL}data/transformations/${fromId}_to_${toId}.json`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function fetchAllSymbols(ids: string[]): Promise<IPASymbol[]> {
  return Promise.all(ids.map(id => fetchSymbol(id)));
}
