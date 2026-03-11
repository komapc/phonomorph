import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface SearchResult {
  id: string;
  fromId: string;
  toId: string;
  name: string;
}

interface SearchBarProps {
  onResultClick?: (fromId: string, toId: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onResultClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { index: dataIndex } = useData();

  // Search transformations when query changes
  useEffect(() => {
    if (!query.trim() || !dataIndex) {
      setResults([]);
      return;
    }

    const queryLower = query.toLowerCase();
    const filtered = dataIndex.transformations
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

    setResults(filtered);
    setIsOpen(filtered.length > 0);
  }, [query, dataIndex]);

  const handleResultClick = (fromId: string, toId: string) => {
    onResultClick?.(fromId, toId);
    setQuery('');
    setResults([]);
    setIsOpen(false);
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
          onFocus={() => setIsOpen(results.length > 0)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
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
            if (e.key === 'Escape') setIsOpen(false);
          }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0' }}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      {isOpen && results.length > 0 && (
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

      {query && results.length === 0 && (
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
