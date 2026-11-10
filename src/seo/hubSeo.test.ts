import { describe, it, expect } from 'vitest';
import { hubSeo } from './hubSeo';

describe('hubSeo', () => {
  it('builds title, canonical and encodes the name', () => {
    const s = hubSeo('language', 'African American Vernacular English', 5);
    expect(s.title).toBe('African American Vernacular English Sound Changes | EchoDrift');
    expect(s.canonical).toMatch(/\/language\/African%20American%20Vernacular%20English$/);
    expect(s.robots).toBeUndefined();
  });

  it('marks single-shift hubs noindex', () => {
    const s = hubSeo('process', 'Rare', 1);
    expect(s.robots).toBe('noindex, follow');
    expect(s.head.some(t => t.attrs.name === 'robots')).toBe(true);
  });

  it('puts the language count in process titles', () => {
    expect(hubSeo('process', 'Vowel Raising', 12, 30).title).toBe('Vowel Raising — sound change examples in 30 languages | EchoDrift');
    expect(hubSeo('process', 'Rare', 2, 1).title).toBe('Rare — sound change examples in 1 language | EchoDrift');
  });

  it('says "definition" only when the glossary has one, and uses it as the description', () => {
    const s = hubSeo('process', 'Lenition', 141, 315);
    expect(s.title).toBe('Lenition — definition and examples in 315 languages | EchoDrift');
    expect(s.description).toMatch(/^A phonetic process where a consonant becomes/);
  });

  it('keeps sound-law and non-process titles as they were', () => {
    expect(hubSeo('process', "Grimm's Law", 20, 15).title).toBe("Grimm's Law: Sound Changes and Examples | EchoDrift");
    expect(hubSeo('family', 'Germanic', 389).title).toBe('Germanic Sound Changes | EchoDrift');
  });

  it('mentions the count in the description', () => {
    expect(hubSeo('family', 'Germanic', 389).description).toContain('389');
  });
});
