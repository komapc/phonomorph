import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface SearchBarProps {
  onResultClick?: (fromId: string, toId: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onResultClick }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { index: dataIndex } = useData();

  // Search transformations when query changes
  const results = useMemo(() => {
    if (!query.trim() || !dataIndex) {
      return [];
    }

    const queryLower = query.toLowerCase();
    return dataIndex.transformations
      .filter(t => {
        const nameMatch = t.name.toLowerCase().includes(queryLower);
        const idMatch = t.id.toLowerCase().includes(queryLower);
        return nameMatch || idMatch;
      })
      .slice(0, 10) // Limit to 10 results
      .map(t => {
        const [fromId, toId] = t.id.split('_to_');
        return {
          id: t.id,
          fromId,
          toId,
          name: t.name
        };
      });
  }, [query, dataIndex]);

  const isOpen = isFocused && results.length > 0;

  const handleResultClick = (fromId: string, toId: string) => {
    onResultClick?.(fromId, toId);
    setQuery('');
    setIsFocused(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={16} style={{ position: 'absolute', left: '8px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Search shifts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          aria-label="Search phonetic shifts"
          style={{
            width: '100%',
            padding: '0.4rem 0.75rem 0.4rem 2rem',
            background: 'var(--surface-color)',
            color: 'white',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            fontSize: '0.85rem',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsFocused(false);
          }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
            }}
            style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0' }}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.5rem',
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {results.map(result => (
            <button
              key={result.id}
              onClick={() => handleResultClick(result.fromId, result.toId)}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.75rem',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--border-color)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{ fontWeight: 600 }}>{result.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {result.id}
              </div>
            </button>
          ))}
        </div>
      )}

      {query && !isFocused && results.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.5rem',
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '0.75rem',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            zIndex: 1000
          }}
        >
          No shifts found matching "{query}"
        </div>
      )}
    </div>
  );
};
