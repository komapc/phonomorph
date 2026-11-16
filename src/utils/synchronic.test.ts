import { describe, it, expect } from 'vitest';
import { synchronicFlags, synchronicBadge } from './synchronic';
import { validate } from '../../scripts/validate-schema';

const ex = [{ from: 'a', to: 'b' }];

describe('synchronicFlags', () => {
  it('is all false for a purely historical cell', () => {
    expect(synchronicFlags(undefined, [{}])).toEqual({ isAllophone: false, isMixed: false, isFree: false });
  });
  it('marks conditioned allophony, not free', () => {
    expect(synchronicFlags(true, [{ isAllophone: true }])).toEqual({ isAllophone: true, isMixed: false, isFree: false });
  });
  it('marks free variation when every synchronic entry is free', () => {
    expect(synchronicFlags(true, [{ isAllophone: true, variation: 'free' }])).toEqual({ isAllophone: true, isMixed: false, isFree: true });
  });
  it('keeps historical entries out of the free check but flags the mix', () => {
    expect(synchronicFlags(true, [{}, { isAllophone: true, variation: 'free' }])).toEqual({ isAllophone: true, isMixed: true, isFree: true });
  });
  it('is not free when free and conditioned entries are combined', () => {
    expect(synchronicFlags(true, [{ isAllophone: true }, { isAllophone: true, variation: 'free' }]).isFree).toBe(false);
  });
});

describe('synchronicBadge', () => {
  it.each([
    [{}, 'ALLO', 'Allophone'],
    [{ isMixed: true }, 'ALLO+', 'Allophone and historical change'],
    [{ isFree: true }, 'FREE', 'Free variation'],
    [{ isFree: true, isMixed: true }, 'FREE+', 'Free variation and historical change'],
  ])('%o → %s', (d, label, title) => expect(synchronicBadge(d)).toEqual({ label, title }));
});

describe('validate: variation', () => {
  const base = {
    fromId: 'a', toId: 'b', preamble: 'p', phoneticEffects: 'X', certainty: 3, commonality: 1,
    sources: ['S (2020). T.'], tags: [],
  };
  const run = (le: object, cell?: boolean) =>
    validate('a_to_b.json', { ...base, ...(cell ? { isAllophone: true } : {}), languageExamples: [{ language: 'L', examples: ex, ...le }] }).errors;

  it('accepts free variation on an allophonic entry', () => {
    expect(run({ isAllophone: true, variation: 'free' }, true)).toEqual([]);
  });
  it('rejects free variation without isAllophone', () => {
    expect(run({ variation: 'free' })).toContainEqual(expect.stringMatching(/requires isAllophone/));
  });
  it('rejects unknown variation values', () => {
    expect(run({ isAllophone: true, variation: 'optional' }, true)).toContainEqual(expect.stringMatching(/must be "free"/));
  });
});
