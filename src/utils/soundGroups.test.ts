import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { IPASymbol } from '../data/loader';
import {
  ALL_RARE, CLASS_GROUPS, voicingOf, isClassSymbol, isSymbolToggledOn, parseRareParam, rareGroupOf, serializeRareParam,
} from './soundGroups';
import type { RareGroupId } from './soundGroups';

// The tracked per-symbol files; index.json is generated and gitignored, so absent in CI.
const SYMBOL_DIR = resolve(__dirname, '../../public/data/symbols');
const symbols: IPASymbol[] = readdirSync(SYMBOL_DIR)
  .filter(f => f.endsWith('.json'))
  .sort()
  .map(f => JSON.parse(readFileSync(join(SYMBOL_DIR, f), 'utf8')));

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

  it('loads the symbol set', () => {
    expect(symbols.filter(s => s.manner === 'Ejective').length).toBeGreaterThan(0);
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

  it('derives voicing for every consonant, including unmarked sonorants and ejectives', () => {
    const by = (id: string) => voicingOf(symbols.find(s => s.id === id)!);
    expect(by('m')).toBe('voiced');
    expect(by('r')).toBe('voiced');
    expect(by('k_ejective')).toBe('voiceless');
    expect(by('glottal_stop')).toBe('voiceless');
    expect(by('s')).toBe('voiceless');
    expect(by('z')).toBe('voiced');
    expect(by('empty')).toBeNull();
    for (const s of symbols) if (s.category === 'consonant' && s.id !== 'empty') expect(voicingOf(s), s.id).not.toBeNull();
  });
});
