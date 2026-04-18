import type { DataIndex } from '../data/loader';

export interface SearchResult {
  id: string;
  fromId: string;
  toId: string;
  name: string;
  matchingTag?: string;
}

export const searchTransformations = (query: string, dataIndex: DataIndex | null): SearchResult[] => {
  if (!query.trim() || !dataIndex) {
    return [];
  }

  const queryLower = query.toLowerCase().trim();

  // Feature-based search (e.g., [+nasal], [-voiced], [nasal], nasal)
  const featureRegex = /^\[?([+-])?([a-z]+)\]?$/i;
  const featureMatch = queryLower.match(featureRegex);

  // List of known features to avoid false positives on plain words
  const knownFeatures = ['nasal', 'nasalized', 'aspirated', 'aspiration', 'palatalized', 'palatal', 'exotic', 'diphthong', 'voiced', 'voiceless'];

  if (featureMatch && (featureMatch[1] || knownFeatures.includes(featureMatch[2].toLowerCase()))) {
    const sign = featureMatch[1] || '+';
    const feature = featureMatch[2].toLowerCase();
    const targetValue = sign === '+';
    const featureKey = `is${feature.charAt(0).toUpperCase()}${feature.slice(1)}`;

    // Map common feature names to internal keys
    const featureMap: Record<string, string> = {
      'nasal': 'isNasalized',
      'nasalized': 'isNasalized',
      'aspirated': 'isAspirated',
      'aspiration': 'isAspirated',
      'palatalized': 'isPalatalized',
      'palatal': 'isPalatalized',
      'exotic': 'isExotic',
      'diphthong': 'isDiphthong'
    };

    const actualKey = featureMap[feature] || featureKey;

    // Filter symbols matching the feature
    const matchingSymbolIds = new Set(
      dataIndex.symbols
        .filter(s => {
          if (feature === 'voiced') {
            const isVoiced = s.name.toLowerCase().includes('voiced') && !s.name.toLowerCase().includes('voiceless');
            return targetValue ? isVoiced : !isVoiced;
          }
          return (s as unknown as Record<string, boolean>)[actualKey] === targetValue;
        })
        .map(s => s.id)
    );

    // Return transformations where either side matches the feature
    return dataIndex.transformations
      .filter(t => {
        const [fromId, toId] = t.id.split('_to_');
        return matchingSymbolIds.has(fromId) || matchingSymbolIds.has(toId);
      })
      .slice(0, 15)
      .map(t => {
        const [fromId, toId] = t.id.split('_to_');
        return {
          id: t.id,
          fromId,
          toId,
          name: t.name,
          matchingTag: `${sign}${feature}`
        };
      });
  }

  // Default name/tag/language search
  return dataIndex.transformations
    .filter(t => {
      const nameMatch = t.name.toLowerCase().includes(queryLower);
      const idMatch = t.id.toLowerCase().includes(queryLower);
      const tagMatch = t.tags?.some(tag => tag.toLowerCase().includes(queryLower));
      const langMatch = t.languages?.some(lang => lang.toLowerCase().includes(queryLower));
      return nameMatch || idMatch || tagMatch || langMatch;
    })
    .slice(0, 15) // Limit to 15 results
    .map(t => {
      const [fromId, toId] = t.id.split('_to_');
      // Find if the query matched a tag specifically
      const matchingTag = t.tags?.find(tag => tag.toLowerCase().includes(queryLower));
      
      return {
        id: t.id,
        fromId,
        toId,
        name: t.name,
        matchingTag
      };
    });
};
