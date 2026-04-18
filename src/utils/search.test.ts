import { describe, it, expect } from 'vitest';
import { searchTransformations } from './search';
import type { DataIndex } from '../data/loader';

const mockDataIndex: DataIndex = {
  symbols: [
    { id: 'p', symbol: 'p', name: 'Voiceless bilabial plosive', category: 'consonant', manner: 'plosive', place: 'bilabial' },
    { id: 'b', symbol: 'b', name: 'Voiced bilabial plosive', category: 'consonant', manner: 'plosive', place: 'bilabial' },
    { id: 'm', symbol: 'm', name: 'Voiced bilabial nasal', category: 'consonant', manner: 'nasal', place: 'bilabial', isNasalized: true },
    { id: 'p_asp', symbol: 'pʰ', name: 'Aspirated voiceless bilabial plosive', category: 'consonant', isAspirated: true },
  ],
  transformations: [
    { id: 'p_to_b', name: 'Voicing', commonality: 5, tags: ['lenition'], languages: ['Latin'] },
    { id: 'p_to_m', name: 'Nasalization', commonality: 3, tags: ['nasal'], languages: ['Old Irish'] },
    { id: 'p_to_p_asp', name: 'Aspiration', commonality: 4, tags: ['aspiration'] },
  ],
  unattested: [],
  stats: {
    totalExamples: 10,
    totalSources: 5,
    totalAllophones: 0,
    families: ['Indo-European'],
    languages: ['Latin', 'Old Irish']
  }
};

describe('searchTransformations', () => {
  it('returns empty array for empty query', () => {
    expect(searchTransformations('', mockDataIndex)).toEqual([]);
  });

  it('returns empty array for null index', () => {
    expect(searchTransformations('p', null)).toEqual([]);
  });

  it('finds transformations by name', () => {
    const results = searchTransformations('voicing', mockDataIndex);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Voicing');
  });

  it('finds transformations by tag', () => {
    const results = searchTransformations('nasal', mockDataIndex);
    // Should match by name 'Nasalization' AND tag 'nasal'
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.id === 'p_to_m')).toBe(true);
  });

  it('performs feature-based search [+nasal]', () => {
    const results = searchTransformations('[+nasal]', mockDataIndex);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('p_to_m');
  });

  it('performs feature-based search [+voiced]', () => {
    const results = searchTransformations('[+voiced]', mockDataIndex);
    // m is voiced, b is voiced. p_to_b and p_to_m should match.
    expect(results.length).toBe(2);
    expect(results.map(r => r.id)).toContain('p_to_b');
    expect(results.map(r => r.id)).toContain('p_to_m');
  });

  it('performs feature-based search [-voiced]', () => {
    const results = searchTransformations('[-voiced]', mockDataIndex);
    // p is unvoiced. all transformations involve p.
    expect(results.length).toBe(3);
  });

  it('performs feature-based search [aspirated]', () => {
    const results = searchTransformations('[aspirated]', mockDataIndex);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('p_to_p_asp');
  });
  
  it('handles bracket-less features for known terms', () => {
    const results = searchTransformations('nasal', mockDataIndex);
    // 'nasal' is a known feature, so it should trigger feature search as well
    // but here it also matches the name/tag.
    expect(results.some(r => r.id === 'p_to_m')).toBe(true);
  });
});
