import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDataIndex, fetchAllSymbols } from '../data/loader';
import type { IPASymbol, DataIndex } from '../data/loader';

const Home = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'vowel' | 'consonant'>('all');
  const [showExotic, setShowExotic] = useState(false);
  const [symbols, setSymbols] = useState<IPASymbol[]>([]);
  const [dataIndex, setDataIndex] = useState<DataIndex | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const index = await fetchDataIndex();
        setDataIndex(index);
        const allSymbols = await fetchAllSymbols(index.symbols);
        setSymbols(allSymbols);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const filteredSymbols = symbols.filter(s => {
    const typeMatch = filter === 'all' || s.category === filter;
    const exoticMatch = showExotic || !s.isExotic;
    return typeMatch && exoticMatch;
  });

  const hasTransformation = (fromId: string, toId: string) => {
    return dataIndex?.transformations.includes(`${fromId}_to_${toId}`);
  };

  const handleCellClick = (fromId: string, toId: string) => {
    if (hasTransformation(fromId, toId)) {
      navigate(`/transform/${fromId}/${toId}`);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading Atlas...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>Sound Matrix</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Select a source and target sound to view transformation details.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="filter-group" style={{ display: 'flex', background: 'var(--surface-color)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setFilter('all')}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: filter === 'all' ? 'var(--accent-color)' : 'transparent', color: 'white' }}
            >All</button>
            <button 
              onClick={() => setFilter('consonant')}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: filter === 'consonant' ? 'var(--accent-color)' : 'transparent', color: 'white' }}
            >Consonants</button>
            <button 
              onClick={() => setFilter('vowel')}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: filter === 'vowel' ? 'var(--accent-color)' : 'transparent', color: 'white' }}
            >Vowels</button>
          </div>
          <button 
            onClick={() => setShowExotic(!showExotic)}
            style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color)', 
              background: showExotic ? 'rgba(79, 70, 229, 0.2)' : 'var(--surface-color)',
              color: showExotic ? 'var(--accent-color)' : 'white'
            }}
          >
            {showExotic ? 'Hide Exotic' : 'Show Exotic'}
          </button>
        </div>
      </div>

      <div className="matrix-wrapper">
        <table className="ipa-table">
          <thead>
            <tr>
              <th className="row-header">From \ To</th>
              {filteredSymbols.map(s => (
                <th key={s.id} title={s.name}>[{s.symbol}]</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredSymbols.map(rowSymbol => (
              <tr key={rowSymbol.id}>
                <th className="row-header" title={rowSymbol.name}>[{rowSymbol.symbol}]</th>
                {filteredSymbols.map(colSymbol => {
                  const isDiagonal = rowSymbol.id === colSymbol.id;
                  const active = hasTransformation(rowSymbol.id, colSymbol.id);
                  
                  return (
                    <td 
                      key={colSymbol.id}
                      className={isDiagonal ? 'cell-diagonal' : active ? 'cell-transformation' : 'cell-empty'}
                      onClick={() => !isDiagonal && handleCellClick(rowSymbol.id, colSymbol.id)}
                    >
                      {active && (
                        <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                          Documented
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Home;
