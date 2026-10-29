import { describe, it, expect } from 'vitest';
import { displayLanguage, transformTitle, transformDescription, clampText, primaryEffect } from './transformMeta';

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
  it('leads with the process and names the first language plus a readable count', () => {
    expect(transformTitle('[k] → [x]', { phoneticEffects: 'Lenition', languageExamples: [{ language: 'Irish' }, { language: 'Welsh' }] })).toBe(
      'Lenition: [k] → [x] Sound Change in Irish & 1 more | EchoDrift'
    );
  });
  it('drops parts until the title fits 65 characters, never the brand', () => {
    expect(transformTitle('[n] → [nʲ]', t)).toBe('Palatalization: [n] → [nʲ] in Russian & 1 more | EchoDrift');
    const many = { ...t, languageExamples: ['Old Church Slavonic', 'Russian', 'Polish'].map((language) => ({ language })) };
    expect(transformTitle('[kʲ] → [s]', many)).toBe('Palatalization: [kʲ] → [s] in 3 languages | EchoDrift');
    expect(transformTitle('[k] → [x]', { ...many, phoneticEffects: 'Lenition' })).toBe('Lenition: [k] → [x] Sound Change in 3 languages | EchoDrift');
  });
  it('prefers the process searchers use over a generic "chain shift"', () => {
    const ash = { phoneticEffects: 'Vowel Raising, Chain Shift', languageExamples: [{ language: 'New Zealand English' }] };
    expect(primaryEffect(ash)).toBe('Vowel Raising');
    expect(primaryEffect({ phoneticEffects: 'Raising, Great Vowel Shift' })).toBe('Great Vowel Shift');
    expect(transformTitle('[æ] → [ɛ]', { ...ash, languageExamples: [{ language: 'Afrikaans' }] }, { symbol: 'æ', category: 'vowel' })).toBe(
      'æ-raising: [æ] → [ɛ] Vowel Raising in Afrikaans | EchoDrift'
    );
    expect(transformTitle('[æ] → [ɛ]', ash, { symbol: 'æ', category: 'vowel' })).toBe(
      'æ-raising: [æ] → [ɛ] in New Zealand English | EchoDrift'
    );
    // Consonant processes keep their plain name, without doubling it.
    expect(transformTitle('[f] → [ɸ]', { phoneticEffects: 'Bilabialization', languageExamples: [{ language: 'Māori' }] }, { symbol: 'f', category: 'consonant' })).toBe(
      'Bilabialization: [f] → [ɸ] Sound Change in Māori | EchoDrift'
    );
  });
  it('spells out languages in the description', () => {
    expect(transformDescription('[n] → [nʲ]', t)).toBe(
      '[n] → [nʲ] palatalization, attested in Russian and Irish. The palatalization of [n] before front vowels.'
    );
  });
  it('omits the language part when there are none', () => {
    expect(transformTitle('[a] → [uo]', { phoneticEffects: 'Breaking' })).toBe('Breaking: [a] → [uo] Sound Change | EchoDrift');
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
