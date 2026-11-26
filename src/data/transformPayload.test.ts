import { describe, it, expect } from 'vitest';
import { buildPayload } from './transformPayload';
import type { PayloadContext } from './transformPayload';
import type { IPASymbol, Transformation, TransformationMeta } from './loader';
import { hubNameOk } from '../utils/hubName';

const sym = (id: string): IPASymbol => ({ id, symbol: id, name: id, category: 'consonant' });
const t = {
  fromId: 'p',
  toId: 'f',
  preamble: '',
  phoneticEffects: 'Lenition',
  languageExamples: [
    { language: 'Gothic', languageFamily: 'Germanic', examples: [] },
    { language: 'Arabic', languageFamily: 'Arabic', examples: [] },
  ],
  certainty: 3,
  commonality: 3,
  tags: ['Lenition'],
} as unknown as Transformation;
const meta = (id: string, tags: string[]) => ({ id, name: id, tags }) as unknown as TransformationMeta;
const ctx = (catalog: TransformationMeta[]): PayloadContext => ({
  catalog,
  symbols: [],
  families: ['Germanic', 'Arabic'],
  mappedSources: {},
});

describe('buildPayload', () => {
  it('links the reverse shift only when it exists', () => {
    const only = buildPayload('p', 'f', sym('p'), sym('f'), t, ctx([meta('p_to_f', ['Germanic'])]));
    expect(only.hasReverse).toBe(false);
    const both = buildPayload('p', 'f', sym('p'), sym('f'), t, ctx([meta('p_to_f', ['Germanic']), meta('f_to_p', [])]));
    expect(both.hasReverse).toBe(true);
  });

  it('keeps only families some shift is tagged with', () => {
    const p = buildPayload('p', 'f', sym('p'), sym('f'), t, ctx([meta('p_to_f', ['Germanic'])]));
    expect(p.familyNames).toEqual(['Germanic']);
  });

  it('assumes everything exists before the catalog loads', () => {
    const p = buildPayload('p', 'f', sym('p'), sym('f'), t, ctx([]));
    expect(p.hasReverse).toBe(true);
    expect(p.familyNames.sort()).toEqual(['Arabic', 'Germanic']);
  });
});

describe('hubNameOk', () => {
  it('rejects names that cannot be a static page', () => {
    expect(hubNameOk("Grimm's Law")).toBe(true);
    expect(hubNameOk('Old English / Old High German')).toBe(false);
    expect(hubNameOk('Circassian: Hakuchi')).toBe(false);
    expect(hubNameOk(' Gothic')).toBe(false);
  });
});
