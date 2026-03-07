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

export interface IPASymbolMeta {
  id: string;
  symbol: string;
  name: string;
  category: 'vowel' | 'consonant';
  manner?: string;
  isExotic?: boolean;
}

export interface TransformationMeta {
  id: string;
  name: string;
  commonality: number;
}

export interface DataIndex {
  symbols: IPASymbolMeta[];
  transformations: TransformationMeta[];
  unattested: string[];
}

// In production on GitHub Pages, we need to respect the base path
const BASE_URL = import.meta.env.BASE_URL;

export const GITHUB_REPO = 'komapc/phonomorph';

export async function fetchDataIndex(): Promise<DataIndex> {
  const response = await fetch(`${BASE_URL}data/index.json`);
  if (!response.ok) throw new Error(`Failed to fetch data index: ${response.status}`);
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
