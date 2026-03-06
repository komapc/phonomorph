import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { symbols, transformations } from '../data/ipa';

const Home = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'vowel' | 'consonant'>('all');
  const [showExotic, setShowExotic] = useState(false);

  const filteredSymbols = symbols.filter(s => {
    const typeMatch = filter === 'all' || s.category === filter;
    const exoticMatch = showExotic || !s.isExotic;
    return typeMatch && exoticMatch;
  });

  const getTransformation = (fromId: string, toId: string) => {
    return transformations.find(t => t.fromId === fromId && t.toId === toId);
  };

  const handleCellClick = (fromId: string, toId: string) => {
    if (getTransformation(fromId, toId)) {
      navigate(`/transform/${fromId}/${toId}`);
    }
  };

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
                  const transformation = getTransformation(rowSymbol.id, colSymbol.id);
                  
                  return (
                    <td 
                      key={colSymbol.id}
                      className={isDiagonal ? 'cell-diagonal' : transformation ? 'cell-transformation' : 'cell-empty'}
                      onClick={() => !isDiagonal && handleCellClick(rowSymbol.id, colSymbol.id)}
                    >
                      {transformation && (
                        <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                          {transformation.commonality >= 4 ? 'Frequent' : 'Documented'}
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
