// Synchronic (non-historical) entries in a transformation: conditioned
// allophony, or free variation when the entry also sets variation: 'free'.

export interface SynchronicEntry {
  isAllophone?: boolean;
  variation?: string;
}

export interface SynchronicFlags {
  isAllophone: boolean;
  // Synchronic cell that also documents historical changes
  isMixed: boolean;
  // Every synchronic entry is free variation
  isFree: boolean;
}

export function synchronicFlags(cellIsAllophone: boolean | undefined, entries: SynchronicEntry[]): SynchronicFlags {
  const isAllophone = cellIsAllophone === true;
  const synchronic = entries.filter(le => le.isAllophone === true);
  return {
    isAllophone,
    isMixed: isAllophone && synchronic.length < entries.length,
    isFree: isAllophone && synchronic.length > 0 && synchronic.every(le => le.variation === 'free'),
  };
}

// Matrix badge: ALLO / FREE, with "+" when the cell also has a historical change.
export function synchronicBadge(d: { isMixed?: boolean; isFree?: boolean }): { label: string; title: string } {
  return {
    label: `${d.isFree ? 'FREE' : 'ALLO'}${d.isMixed ? '+' : ''}`,
    title: `${d.isFree ? 'Free variation' : 'Allophone'}${d.isMixed ? ' and historical change' : ''}`,
  };
}
