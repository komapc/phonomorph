import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { IPASymbol } from '../data/loader';
import {
  ALL_RARE, CLASS_GROUPS, isClassSymbol, isSymbolToggledOn, parseRareParam, rareGroupOf, serializeRareParam,
} from './soundGroups';
import type { RareGroupId } from './soundGroups';

const symbols: IPASymbol[] = JSON.parse(
  readFileSync(resolve(__dirname, '../../public/data/index.json'), 'utf8')
).symbols;

// The pre-split rule from useFilteredSymbols (single Exotic toggle).
const legacyVisible = (s: IPASymbol, exo: boolean, pal: boolean, nas: boolean, dip: boolean, asp: boolean) => {
  if (s.isPalatalized && !pal) return false;
  if (s.isNasalized && !nas) return false;
  if (s.isDiphthong && !dip) return false;
  if (s.isAspirated && !asp) return false;
  const special = (s.isPalatalized && pal) || (s.isNasalized && nas) || (s.isDiphthong && dip) || (s.isAspirated && asp);
  if (special) return true;
  if (s.isExotic && !exo) return false;
  return true;
};

describe('soundGroups', () => {
  it('matches the legacy Exotic/class rule for all 32 toggle combinations', () => {
    for (let mask = 0; mask < 32; mask++) {
      const [exo, pal, nas, dip, asp] = [0, 1, 2, 3, 4].map(b => Boolean(mask & (1 << b)));
      const rare = new Set<RareGroupId>(exo ? ALL_RARE : []);
      for (const s of symbols) {
        expect(isSymbolToggledOn(s, rare, { pal, nas, dip, asp }), `${s.id} mask=${mask}`)
          .toBe(legacyVisible(s, exo, pal, nas, dip, asp));
      }
    }
  });

  it('puts ejectives, implosives and clicks in their own groups', () => {
    for (const s of symbols) {
      if (s.manner === 'Ejective') expect(rareGroupOf(s)).toBe('ejective');
      if (s.manner === 'Implosive') expect(rareGroupOf(s)).toBe('implosive');
      if (s.manner === 'Click') expect(rareGroupOf(s)).toBe('click');
    }
  });

  it('every exotic non-class symbol is reachable from some group checkbox', () => {
    const none = { pal: false, nas: false, dip: false, asp: false };
    for (const s of symbols.filter(x => x.isExotic && !isClassSymbol(x))) {
      expect(isSymbolToggledOn(s, new Set(), none), s.id).toBe(false);
      expect(isSymbolToggledOn(s, new Set([rareGroupOf(s)]), none), s.id).toBe(true);
    }
  });

  it('one rare group shows only its own members', () => {
    const none = { pal: false, nas: false, dip: false, asp: false };
    const shown = symbols.filter(s => s.isExotic && isSymbolToggledOn(s, new Set<RareGroupId>(['click']), none));
    expect(shown.map(s => s.id)).toEqual(symbols.filter(s => s.manner === 'Click').map(s => s.id));
  });

  it('round-trips the exotic URL param, keeping legacy exotic=true', () => {
    expect(parseRareParam(null).size).toBe(0);
    expect([...parseRareParam('true')]).toEqual([...ALL_RARE]);
    expect(serializeRareParam(new Set(ALL_RARE))).toBe('true');
    expect(serializeRareParam(new Set())).toBeNull();
    expect(serializeRareParam(new Set<RareGroupId>(['click', 'ejective']))).toBe('ejective,click');
    expect([...parseRareParam('click,bogus,ejective')]).toEqual(['ejective', 'click']);
    expect(CLASS_GROUPS.map(g => g.id).sort()).toEqual(['asp', 'dip', 'nas', 'pal']);
  });
});
