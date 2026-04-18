import React, { useState, useMemo, useRef } from 'react';
import { Search, X, Tag as TagIcon } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import './search.css';

interface SearchBarProps {
  onResultClick?: (fromId: string, toId: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onResultClick }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { index: dataIndex } = useData();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search transformations when query changes
  const results = useMemo(() => {
    if (!query.trim() || !dataIndex) {
      return [];
    }

    const queryLower = query.toLowerCase().trim();

    // Feature-based search (e.g., [+nasal], [-voiced], [nasal], nasal)
    const featureRegex = /^\[?([+-])?([a-z]+)\]?$/i;
    const featureMatch = queryLower.match(featureRegex);

    // List of known features to avoid false positives on plain words
    const knownFeatures = ['nasal', 'nasalized', 'aspirated', 'aspiration', 'palatalized', 'palatal', 'exotic', 'diphthong', 'voiced', 'voiceless'];

    if (featureMatch && dataIndex && (featureMatch[1] || knownFeatures.includes(featureMatch[2].toLowerCase()))) {
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
            return (s as any)[actualKey] === targetValue;
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
  }, [query, dataIndex]);

  const [prevResults, setPrevResults] = useState(results);

  // Reset selected index when results change (derived state pattern)
  if (results !== prevResults) {
    setSelectedIndex(-1);
    setPrevResults(results);
  }

  const isOpen = isFocused && results.length > 0;

  const handleResultClick = (fromId: string, toId: string) => {
    onResultClick?.(fromId, toId);
    setQuery('');
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0) {
        const result = results[selectedIndex];
        handleResultClick(result.fromId, result.toId);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search shifts, processes (e.g. lenition)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          aria-label="Search phonetic shifts"
          aria-expanded={isOpen}
          aria-controls="search-results-dropdown"
          aria-haspopup="listbox"
          className="search-input"
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="search-clear-btn"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      {isOpen && (
        <div
          id="search-results-dropdown"
          className="search-dropdown"
          role="listbox"
          ref={dropdownRef}
        >
          {results.map((result, index) => (
            <button
              key={result.id}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleResultClick(result.fromId, result.toId)}
              className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
            >
              <div className="search-result-name">{result.name}</div>
              <div className="search-result-meta">
                <span>{result.id.replace('_to_', ' → ')}</span>
                {result.matchingTag && (
                  <span className="search-result-tag">
                    <TagIcon size={8} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                    {result.matchingTag}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {query && isFocused && results.length === 0 && (
        <div className="search-no-results">
          No shifts found matching "{query}"
        </div>
      )}
    </div>
  );
};
