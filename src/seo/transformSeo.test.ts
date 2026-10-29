import { transformTitle } from '../utils/transformMeta';
import { describe, it, expect } from 'vitest';
import { transformSeo, headTagsToHtml, jsonForScript } from './transformSeo';

const base = {
  fromId: 'p',
  toId: 'f',
  fromSymbol: { symbol: 'p', name: 'Voiceless bilabial plosive' },
  toSymbol: { symbol: 'f', name: 'Voiceless labiodental fricative' },
};

describe('transformSeo', () => {
  const t = {
    phoneticEffects: 'Fricativization, Lenition',
    preamble: 'Grimm\'s Law.',
    languageExamples: [{ language: 'Georgian', examples: [{ from: 'a', to: 'b' }] }],
    sources: ['Smith (2000)'],
    tags: ['Spirantization'],
  };

  it('builds canonical, title and a single title/description tag', () => {
    const seo = transformSeo({ ...base, transformation: t });
    expect(seo.canonical).toBe('https://echodrift.lipu.dev/transform/p/f');
    expect(seo.title).toContain('Fricativization: [p] → [f]');
    expect(seo.head.filter((h) => h.tag === 'title')).toHaveLength(1);
    expect(seo.robots).toBeUndefined();
  });

  it('noindexes shifts without examples', () => {
    const seo = transformSeo({ ...base, transformation: { ...t, languageExamples: [] } });
    expect(seo.robots).toBe('noindex, follow');
    expect(headTagsToHtml(seo.head)).toContain('name="robots" content="noindex, follow"');
  });

  it('uses mapped source titles for citations', () => {
    const seo = transformSeo({ ...base, transformation: t, mappedSources: { 'Smith (2000)': { title: 'Smith, Sounds' } } });
    const graph = seo.jsonLd['@graph'] as { '@type': string; citation?: string[] }[];
    expect(graph.find((n) => n['@type'] === 'ScholarlyArticle')?.citation).toEqual(['Smith, Sounds']);
  });

  it('escapes html in attributes and script json', () => {
    const html = headTagsToHtml([{ tag: 'meta', attrs: { name: 'x', content: 'a"<b' } }]);
    expect(html).toBe('<meta name="x" content="a&quot;&lt;b">');
    expect(jsonForScript({ a: '</script>' })).not.toContain('</script>');
  });

  it('leads the title with a named process rather than the first listed effect', () => {
    const t = { phoneticEffects: 'Rounding, Raising, Iotacism' };
    expect(transformTitle('[e] → [y]', t)).toMatch(/^Iotacism: \[e\] → \[y\]/);
  });

  it('opens with an answer-first summary naming the change, its reach and an example', () => {
    const seo = transformSeo({ ...base, transformation: t });
    expect(seo.summary).toBe(
      '[p] → [f] (voiceless bilabial plosive to voiceless labiodental fricative) is a fricativization sound change documented in 1 language, e.g. a → b (Georgian).'
    );
    expect(seo.title).toBe('Fricativization: [p] → [f] Sound Change in Georgian | EchoDrift');
  });

  it('calls an all-allophone cell allophonic, not a sound change', () => {
    const allo = { ...t, languageExamples: [{ language: 'English', isAllophone: true, examples: [{ from: 'a', to: 'b' }] }] };
    const seo = transformSeo({ ...base, transformation: allo });
    expect(seo.summary).toContain('is an allophonic fricativization documented in 1 language');
    expect(seo.title).toBe('Fricativization: [p] → [f] Allophone in English | EchoDrift');
  });
});
