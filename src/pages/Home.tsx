import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchDataIndex, GITHUB_REPO } from '../data/loader';
import type { IPASymbol, DataIndex } from '../data/loader';

const Home = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State from URL or defaults
  const categoryFilter = (searchParams.get('category') || 'all') as 'all' | 'vowel' | 'consonant';
  const mannerFilter = searchParams.get('manner') || 'all';
  const voicedFilter = searchParams.get('voiced') || 'all';
  const matrixMode = (searchParams.get('mode') || 'symmetric') as 'symmetric' | 'v2c' | 'c2v';
  const [showExotic, setShowExotic] = useState(searchParams.get('exotic') === 'true');

  const [symbols, setSymbols] = useState<IPASymbol[]>([]);
  const [dataIndex, setDataIndex] = useState<DataIndex | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const index = await fetchDataIndex();
        setDataIndex(index);
        setSymbols(index.symbols as IPASymbol[]);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Update URL when showExotic changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (showExotic) newParams.set('exotic', 'true');
    else newParams.delete('exotic');
    setSearchParams(newParams);
  }, [showExotic, searchParams, setSearchParams]);

  const setFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all' || value === 'symmetric') newParams.delete(key);
    else newParams.set(key, value);
    setSearchParams(newParams);
  };

  const filteredSymbols = useMemo(() => {
    return symbols.filter(s => {
      const typeMatch = categoryFilter === 'all' || s.category === categoryFilter;
      const exoticMatch = showExotic || !s.isExotic;
      const mannerMatch = mannerFilter === 'all' || s.manner === mannerFilter;
      
      let voicedMatch = true;
      if (voicedFilter !== 'all') {
        const isVoiced = s.name.toLowerCase().includes('voiced');
        voicedMatch = voicedFilter === 'true' ? isVoiced : !isVoiced;
      }

      return typeMatch && exoticMatch && mannerMatch && voicedMatch;
    });
  }, [symbols, categoryFilter, showExotic, mannerFilter, voicedFilter]);

  const rowSymbols = useMemo(() => {
    if (matrixMode === 'v2c') return symbols.filter(s => s.category === 'vowel' && (showExotic || !s.isExotic));
    if (matrixMode === 'c2v') return symbols.filter(s => s.category === 'consonant' && (showExotic || !s.isExotic));
    return filteredSymbols;
  }, [matrixMode, filteredSymbols, symbols, showExotic]);

  const colSymbols = useMemo(() => {
    if (matrixMode === 'v2c') return symbols.filter(s => s.category === 'consonant' && (showExotic || !s.isExotic));
    if (matrixMode === 'c2v') return symbols.filter(s => s.category === 'vowel' && (showExotic || !s.isExotic));
    return filteredSymbols;
  }, [matrixMode, filteredSymbols, symbols, showExotic]);

  // Manner options for dropdown
  const mannerOptions = useMemo(() => {
    const manners = new Set(symbols.map(s => s.manner).filter(Boolean));
    return Array.from(manners).sort();
  }, [symbols]);

  const documentedInFilter = useMemo(() => {
    return dataIndex?.transformations.filter(t => {
      const [fromId, toId] = t.id.split('_to_');
      return rowSymbols.some(s => s.id === fromId) && colSymbols.some(s => s.id === toId);
    }).length || 0;
  }, [dataIndex, rowSymbols, colSymbols]);

  const totalPossible = rowSymbols.length * colSymbols.length - (matrixMode === 'symmetric' ? rowSymbols.length : 0);
  const coveragePercent = totalPossible > 0 ? ((documentedInFilter / totalPossible) * 100).toFixed(1) : 0;

  const getTransformation = (fromId: string, toId: string) => {
    return dataIndex?.transformations.find(t => t.id === `${fromId}_to_${toId}`);
  };

  const hasTransformation = (fromId: string, toId: string) => {
    return !!getTransformation(fromId, toId);
  };

  const isUnattested = (fromId: string, toId: string) => {
    return dataIndex?.unattested?.includes(`${fromId}_to_${toId}`);
  };

  const handleCellClick = (fromId: string, toId: string) => {
    if (hasTransformation(fromId, toId)) {
      navigate(`/transform/${fromId}/${toId}`);
    } else {
      window.open(`https://github.com/${GITHUB_REPO}/new/master/public/data/transformations?filename=${fromId}_to_${toId}.json`, '_blank');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading Atlas...</div>;
  }

  return (
    <div>
      {/* Stats Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--surface-color)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Documented Shifts</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-color)' }}>{documentedInFilter}</div>
        </div>
        <div style={{ background: 'var(--surface-color)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Matrix</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{rowSymbols.length}×{colSymbols.length}</div>
        </div>
        <div style={{ background: 'var(--surface-color)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coverage</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success-color)' }}>{coveragePercent}%</div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', background: 'rgba(79, 70, 229, 0.2)', border: '1px solid var(--accent-color)', borderRadius: '3px' }}></div>
          <span style={{ color: 'var(--text-secondary)' }}>Documented Shift</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontWeight: 800 }}>[←]</span>
          <span style={{ color: 'var(--text-secondary)' }}>Inverse path available</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: i <= 3 ? 'var(--success-color)' : 'rgba(255,255,255,0.1)' }}></div>)}
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>Commonality (1-5)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ opacity: 0.4, fontWeight: 800 }}>X</span>
          <span style={{ color: 'var(--text-secondary)' }}>Researched: Unattested</span>
        </div>
      </div>

      {/* Advanced Filters */}
      <div style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
          
          <div className="filter-item">
            <label style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Mode</label>
            <select 
              value={matrixMode} 
              onChange={(e) => setFilter('mode', e.target.value)}
              style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}
            >
              <option value="symmetric">Symmetric (Same Axes)</option>
              <option value="v2c">Vowel → Consonant</option>
              <option value="c2v">Consonant → Vowel</option>
            </select>
          </div>

          {matrixMode === 'symmetric' && (
            <>
              <div className="filter-item">
                <label style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Category</label>
                <div style={{ display: 'flex', background: 'var(--bg-color)', padding: '0.2rem', borderRadius: '8px' }}>
                  {['all', 'consonant', 'vowel'].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setFilter('category', cat)}
                      style={{ 
                        padding: '0.4rem 0.8rem', 
                        borderRadius: '6px', 
                        fontSize: '0.85rem',
                        background: categoryFilter === cat ? 'var(--accent-color)' : 'transparent',
                        color: 'white'
                      }}
                    >{cat.charAt(0).toUpperCase() + cat.slice(1)}</button>
                  ))}
                </div>
              </div>

              <div className="filter-item">
                <label style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Manner</label>
                <select 
                  value={mannerFilter} 
                  onChange={(e) => setFilter('manner', e.target.value)}
                  style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}
                >
                  <option value="all">All Manners</option>
                  {mannerOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="filter-item">
                <label style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Voicing</label>
                <select 
                  value={voicedFilter} 
                  onChange={(e) => setFilter('voiced', e.target.value)}
                  style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}
                >
                  <option value="all">All</option>
                  <option value="true">Voiced Only</option>
                  <option value="false">Voiceless Only</option>
                </select>
              </div>
            </>
          )}

          <div style={{ marginLeft: 'auto' }}>
            <button 
              onClick={() => setShowExotic(!showExotic)}
              style={{ 
                padding: '0.5rem 1rem', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)', 
                fontSize: '0.85rem',
                background: showExotic ? 'rgba(79, 70, 229, 0.2)' : 'var(--surface-color)',
                color: showExotic ? 'var(--accent-color)' : 'white'
              }}
            >
              {showExotic ? 'Hide Exotic' : 'Show Exotic'}
            </button>
          </div>
        </div>
      </div>

      {/* The Matrix */}
      <div className="matrix-wrapper">
        <table className="ipa-table">
          <thead>
            <tr>
              <th className="row-header">From \ To</th>
              {colSymbols.map(s => (
                <th key={s.id} title={s.name}>[{s.symbol}]</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowSymbols.map(rowSymbol => (
              <tr key={rowSymbol.id}>
                <th className="row-header" title={rowSymbol.name}>[{rowSymbol.symbol}]</th>
                {colSymbols.map(colSymbol => {
                  const isDiagonal = rowSymbol.id === colSymbol.id;
                  const details = getTransformation(rowSymbol.id, colSymbol.id);
                  const active = !!details;
                  const inverseActive = !active && hasTransformation(colSymbol.id, rowSymbol.id);
                  const unattested = isUnattested(rowSymbol.id, colSymbol.id);
                  
                  let cellClass = 'cell-empty';
                  if (isDiagonal) cellClass = 'cell-diagonal';
                  else if (active) cellClass = 'cell-transformation';
                  else if (inverseActive) cellClass = 'cell-inverse-transformation';
                  else if (unattested) cellClass = 'cell-unattested';

                  let titleText = `No data for [${rowSymbol.symbol}] → [${colSymbol.symbol}] (Click to contribute)`;
                  if (active) titleText = `${details.name} [${rowSymbol.symbol}] → [${colSymbol.symbol}] (Commonality: ${details.commonality}/5)`;
                  else if (inverseActive) titleText = `See inverse shift: [${colSymbol.symbol}] → [${rowSymbol.symbol}]`;
                  else if (unattested) titleText = `Researched: No regular shift found for [${rowSymbol.symbol}] → [${colSymbol.symbol}]`;

                  return (
                    <td 
                      key={colSymbol.id}
                      className={cellClass}
                      onClick={() => {
                        if (active) handleCellClick(rowSymbol.id, colSymbol.id);
                        else if (inverseActive) handleCellClick(colSymbol.id, rowSymbol.id);
                        else if (!isDiagonal && !unattested) handleCellClick(rowSymbol.id, colSymbol.id);
                      }}
                      title={titleText}
                    >
                      {active && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-color)', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '90px', textOverflow: 'ellipsis' }}>
                            {details.name}
                          </div>
                          <div style={{ display: 'flex', gap: '1px' }}>
                            {[...Array(5)].map((_, i) => (
                              <div 
                                key={i} 
                                style={{ 
                                  width: '4px', 
                                  height: '4px', 
                                  borderRadius: '50%', 
                                  background: i < details.commonality ? 'var(--success-color)' : 'rgba(255,255,255,0.1)' 
                                }} 
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {inverseActive && (
                        <div style={{ fontSize: '0.6rem', opacity: 0.5, fontStyle: 'italic' }}>
                          [←]
                        </div>
                      )}
                      {unattested && !active && !inverseActive && (
                        <div style={{ fontSize: '0.6rem', opacity: 0.4 }}>
                          X
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
