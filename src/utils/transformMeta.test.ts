import { describe, it, expect } from 'vitest';
import { displayLanguage, transformTitle, transformDescription, clampText } from './transformMeta';

describe('displayLanguage', () => {
  it.each([
    ['Latin to French', 'French'],
    ['Proto-Slavic to various Modern Slavic languages', 'Proto-Slavic'],
    ['Russian / Slavic', 'Russian'],
    ['English (some dialects)', 'English'],
    ['Romance (Latin to Italian)', 'Romance'],
    ['Various', null],
    ['Various (Loanwords)', null],
    ['Dolgan', 'Dolgan'],
  ])('%s → %s', (raw, want) => expect(displayLanguage(raw)).toBe(want));
});

describe('transformTitle / transformDescription', () => {
  const t = {
    phoneticEffects: 'Palatalization, Assimilation',
    preamble: 'The palatalization of [n] before front vowels.',
    languageExamples: [{ language: 'Russian', examples: [{}] }, { language: 'Irish', examples: [{}] }],
  };
  it('builds a short title with the first language and a count', () => {
    expect(transformTitle('[n] → [nʲ]', t)).toBe('[n] → [nʲ] Palatalization: Sound Change in Russian +1 | EchoDrift');
  });
  it('spells out languages in the description', () => {
    expect(transformDescription('[n] → [nʲ]', t)).toBe(
      '[n] → [nʲ] palatalization, attested in Russian and Irish. The palatalization of [n] before front vowels.'
    );
  });
  it('omits the language part when there are none', () => {
    expect(transformTitle('[a] → [uo]', { phoneticEffects: 'Breaking' })).toBe('[a] → [uo] Breaking: Sound Change | EchoDrift');
  });
});

describe('clampText', () => {
  const long = 'First sentence is here. Second sentence goes on for quite a while longer than the limit allows';
  it('returns short text unchanged', () => {
    expect(clampText('  short   text ', 50)).toBe('short text');
  });
  it('ends on a sentence boundary when one is close to the limit', () => {
    expect(clampText(long, 30)).toBe('First sentence is here.');
  });
  it('never cuts mid-word', () => {
    const out = clampText('alpha beta gamma delta epsilon zeta', 20);
    expect(out.endsWith('…')).toBe(true);
    expect(out).toBe('alpha beta gamma…');
  });
});
