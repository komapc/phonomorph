import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IPASymbol } from '../data/loader';
import { useData } from '../contexts/DataContext';
import MatrixCell from '../components/MatrixCell';
import { MatrixSkeleton } from '../components/MatrixSkeleton';
import { Columns, Settings2, BarChart3, Grid3X3, Star } from 'lucide-react';
import {
  useMatrixFilters,
  useSymbolGrouping,
  useFilteredSymbols,
  useMatrixDimensions,
  useSyncSpecialFiltersToURL
} from '../hooks/useHomeMatrix';

const Home = () => {
  const navigate = useNavigate();
  const { index: dataIndex, loading } = useData();
  const symbols = (dataIndex?.symbols || []) as IPASymbol[];

  const filters = useMatrixFilters();
  const [showExotic, setShowExotic] = useState(filters.searchParams.get('exotic') === 'true');
  const [showPalatalized, setShowPalatalized] = useState(filters.searchParams.get('pal') === 'true');
  const [showNasalized, setShowNasalized] = useState(filters.searchParams.get('nas') === 'true');
  const [showDiphthongs, setShowDiphthongs] = useState(filters.searchParams.get('dip') === 'true');
  const [showAspirated, setShowAspirated] = useState(filters.searchParams.get('asp') === 'true');
  const [compareMode, setCompareMode] = useState(false);
  const [compareQueue, setCompareQueue] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'matrix' | 'landmarks' | 'stats'>('matrix');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useSyncSpecialFiltersToURL(
    showExotic, showPalatalized, showNasalized, showDiphthongs, showAspirated,
    filters.collapseMode, filters.searchParams, filters.setSearchParams
  );

  const filterState = {
    ...filters,
    showExotic, showPalatalized, showNasalized, showDiphthongs, showAspirated
  };
  const filteredSymbols = useFilteredSymbols(symbols, filterState);
  const groupSymbols = useSymbolGrouping(filters.collapseMode);
  const { rowSymbols, colSymbols } = useMatrixDimensions(filteredSymbols, filters.matrixMode, groupSymbols);

  const documentedInFilter = useMemo(() => {
    return dataIndex?.transformations.filter(t => {
      const [fromId, toId] = t.id.split('_to_');
      const inLanguage = filters.languageFilter === 'all' || t.languages?.includes(filters.languageFilter);
      return inLanguage && rowSymbols.some(s => s.id === fromId) && colSymbols.some(s => s.id === toId);
    }) || [];
  }, [dataIndex, rowSymbols, colSymbols, filters.languageFilter]);

  const totalPossible = rowSymbols.length * colSymbols.length - (filters.matrixMode === 'symmetric' ? rowSymbols.length : 0);
  const coveragePercent = totalPossible > 0 ? ((documentedInFilter.length / totalPossible) * 100).toFixed(1) : 0;
  const researchHealth = useMemo(() => {
    if (!dataIndex || dataIndex.transformations.length === 0) return '0.0';
    return (dataIndex.stats.totalExamples / dataIndex.transformations.length).toFixed(1);
  }, [dataIndex]);

  const handleCellClick = useCallback((fromId: string, toId: string) => {
    const shiftId = `${fromId}_to_${toId}`;
    if (compareMode) {
      if (compareQueue.includes(shiftId)) {
        setCompareQueue(compareQueue.filter(id => id !== shiftId));
      } else if (compareQueue.length < 2) {
        const newQueue = [...compareQueue, shiftId];
        setCompareQueue(newQueue);
        if (newQueue.length === 2) {
          navigate(`/compare/${newQueue[0]}/${newQueue[1]}`);
          setCompareMode(false);
          setCompareQueue([]);
        }
      }
      return;
    }
    navigate(`/transform/${fromId}/${toId}`);
  }, [compareMode, compareQueue, navigate]);

  const getCommonalityColor = useCallback((commonality: number, isActive: boolean) => {
    if (!isActive) return "transparent";
    const opacities = [0.1, 0.2, 0.35, 0.5, 0.7];
    return `rgba(79, 70, 229, ${opacities[commonality - 1]})`;
  }, []);

  if (loading) return <MatrixSkeleton />;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Navigation Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem', background: 'var(--surface-color)', padding: '0.4rem', borderRadius: '12px', border: '1px solid var(--border-color)', width: 'fit-content' }}>
        <button 
          onClick={() => setActiveTab('matrix')} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem',
            background: activeTab === 'matrix' ? 'var(--accent-color)' : 'transparent',
            color: activeTab === 'matrix' ? 'white' : 'var(--text-secondary)',
            border: 'none', borderRadius: '8px', fontWeight: 600, transition: 'all 0.2s', cursor: 'pointer'
          }}
        >
          <Grid3X3 size={18} /> Shift Matrix
        </button>
        <button 
          onClick={() => setActiveTab('landmarks')} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem',
            background: activeTab === 'landmarks' ? 'var(--accent-color)' : 'transparent',
            color: activeTab === 'landmarks' ? 'white' : 'var(--text-secondary)',
            border: 'none', borderRadius: '8px', fontWeight: 600, transition: 'all 0.2s', cursor: 'pointer'
          }}
        >
          <Star size={18} /> Landmarks
        </button>
        <button 
          onClick={() => setActiveTab('stats')} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem',
            background: activeTab === 'stats' ? 'var(--accent-color)' : 'transparent',
            color: activeTab === 'stats' ? 'white' : 'var(--text-secondary)',
            border: 'none', borderRadius: '8px', fontWeight: 600, transition: 'all 0.2s', cursor: 'pointer'
          }}
        >
          <BarChart3 size={18} /> Atlas Health
        </button>
      </div>

      {activeTab === 'landmarks' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', animation: 'fadeIn 0.2s ease' }}>
          {dataIndex?.transformations.filter(t => t.commonality === 5).slice(0, 16).map(t => {
            const [f, to] = t.id.split('_to_');
            return (
              <a key={t.id} onClick={() => navigate(`/transform/${f}/${to}`)} style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', textAlign: 'center', transition: 'transform 0.2s' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{f} → {to}</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{t.name}</div>
              </a>
            );
          })}
        </div>
      )}

      {activeTab === 'stats' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', animation: 'fadeIn 0.2s ease' }}>
          <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Documented Shifts</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-color)' }}>{documentedInFilter.length}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.5rem' }}>Currently visible in your selection</div>
          </div>
          <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Matrix Coverage</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success-color)' }}>{coveragePercent}%</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.5rem' }}>Percentage of researched sound pairs</div>
          </div>
          <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Research Health</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{researchHealth}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.5rem' }}>Average examples per documented shift</div>
          </div>
        </div>
      )}

      {activeTab === 'matrix' && (
        <>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', background: 'var(--surface-color)', padding: '0.2rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              {['vowel', 'consonant', 'all'].map(cat => (
                <button key={cat} onClick={() => filters.setFilter('category', cat)} style={{ padding: '0.4rem 1.25rem', borderRadius: '8px', fontSize: '0.85rem', background: filters.categoryFilter === cat ? 'var(--accent-color)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{cat.charAt(0).toUpperCase() + cat.slice(1)}s</button>
              ))}
            </div>
            <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: showAdvancedFilters ? 'var(--surface-color)' : 'transparent', color: 'white', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}><Settings2 size={16} /> Filters</button>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setShowExotic(!showExotic)} style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: showExotic ? 'rgba(79, 70, 229, 0.2)' : 'transparent', color: 'white', cursor: 'pointer' }}>Exotic</button>
              <button onClick={() => { 
                const newState = !showPalatalized;
                setShowPalatalized(newState); setShowNasalized(newState); setShowDiphthongs(newState); setShowAspirated(newState);
              }} style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: showPalatalized ? 'rgba(79, 70, 229, 0.2)' : 'transparent', color: 'white', cursor: 'pointer' }}>Classes</button>
            </div>

            <button onClick={() => { setCompareMode(!compareMode); setCompareQueue([]); }} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '10px', border: '1px solid var(--accent-color)', fontSize: '0.85rem', background: compareMode ? 'var(--accent-color)' : 'transparent', color: compareMode ? 'white' : 'var(--accent-color)', fontWeight: 700, cursor: 'pointer' }}><Columns size={16} /> Compare</button>
          </div>

          {showAdvancedFilters && (
            <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '2rem', animation: 'slideDown 0.2s ease' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                <div><label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Matrix Mode</label><select value={filters.matrixMode} onChange={(e) => filters.setFilter('mode', e.target.value)} style={{ width: '100%', background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.6rem', borderRadius: '8px' }}><option value="symmetric">Symmetric</option><option value="v2c">Vowel → Consonant</option><option value="c2v">Consonant → Vowel</option></select></div>
                <div><label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Language</label><input list="languages" value={filters.languageFilter === 'all' ? '' : filters.languageFilter} placeholder="All" onChange={(e) => filters.setFilter('language', e.target.value || 'all')} style={{ width: '100%', background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.6rem', borderRadius: '8px' }} /><datalist id="languages">{dataIndex?.stats.languages.map(l => <option key={l} value={l} />)}</datalist></div>
              </div>
            </div>
          )}

          <div className="matrix-wrapper" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'auto' }}>
            <table className="ipa-table">
              <thead>
                <tr>
                  <th className="row-header">From \ To</th>
                  {colSymbols.map(s => <th key={s.id}>[{s.symbol}]</th>)}
                </tr>
              </thead>
              <tbody>
                {rowSymbols.map(rS => (
                  <tr key={rS.id}>
                    <th className="row-header">[{rS.symbol}]</th>
                    {colSymbols.map(cS => (
                      <MatrixCell
                        key={cS.id} rowSymbol={rS} colSymbol={cS}
                        isDiagonal={rS.id === cS.id} details={dataIndex?.transformations.find(t => t.id === `${rS.id}_to_${cS.id}`)}
                        inverseDetails={dataIndex?.transformations.find(t => t.id === `${cS.id}_to_${rS.id}`)}
                        unattested={dataIndex?.unattested?.includes(`${rS.id}_to_${cS.id}`) || false}
                        getCommonalityColor={getCommonalityColor} handleCellClick={handleCellClick}
                        highlighted={compareQueue.includes(`${rS.id}_to_${cS.id}`)}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;