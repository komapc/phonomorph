import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IPASymbol } from '../data/loader';
import { useData } from '../contexts/DataContext';
import MatrixCell from '../components/MatrixCell';
import { MatrixSkeleton } from '../components/MatrixSkeleton';
import { Columns, Settings2 } from 'lucide-react';
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

  // State management with custom hooks
  const filters = useMatrixFilters();
  const [showExotic, setShowExotic] = useState(filters.searchParams.get('exotic') === 'true');
  const [showPalatalized, setShowPalatalized] = useState(filters.searchParams.get('pal') === 'true');
  const [showNasalized, setShowNasalized] = useState(filters.searchParams.get('nas') === 'true');
  const [showDiphthongs, setShowDiphthongs] = useState(filters.searchParams.get('dip') === 'true');
  const [showAspirated, setShowAspirated] = useState(filters.searchParams.get('asp') === 'true');
  const [compareMode, setCompareMode] = useState(false);
  const [compareQueue, setCompareQueue] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'matrix' | 'landmarks'>('matrix');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Sync special filters to URL
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
    if (!isActive) return 'transparent';
    const opacities = [0.1, 0.2, 0.35, 0.5, 0.7];
    return `rgba(79, 70, 229, ${opacities[commonality - 1]})`;
  }, []);

  if (loading) return <MatrixSkeleton />;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button onClick={() => setActiveTab('matrix')} style={{ padding: '0.5rem 1rem', background: 'transparent', color: activeTab === 'matrix' ? 'var(--accent-color)' : 'var(--text-secondary)', border: 'none', borderBottom: activeTab === 'matrix' ? '2px solid var(--accent-color)' : 'none', fontWeight: 700, cursor: 'pointer' }}>Shift Matrix</button>
        <button onClick={() => setActiveTab('landmarks')} style={{ padding: '0.5rem 1rem', background: 'transparent', color: activeTab === 'landmarks' ? 'var(--accent-color)' : 'var(--text-secondary)', border: 'none', borderBottom: activeTab === 'landmarks' ? '2px solid var(--accent-color)' : 'none', fontWeight: 700, cursor: 'pointer' }}>Landmark Shifts</button>
      </div>

      {activeTab === 'landmarks' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {dataIndex?.transformations.filter(t => t.commonality === 5).slice(0, 16).map(t => {
            const [f, to] = t.id.split('_to_');
            const fS = dataIndex.symbols.find(s => s.id === f);
            const tS = dataIndex.symbols.find(s => s.id === to);
            return (
              <a key={t.id} onClick={() => navigate(`/transform/${f}/${to}`)} style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{fS?.symbol || f} → {tS?.symbol || to}</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{t.name}</div>
              </a>
            );
          })}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Documented Shifts</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{documentedInFilter.length}</div>
            </div>
            <div style={{ background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Matrix Coverage</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{coveragePercent}%</div>
            </div>
            <div style={{ background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Research Health</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{researchHealth}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', background: 'var(--surface-color)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {['vowel', 'consonant', 'all'].map(cat => (
                <button key={cat} onClick={() => filters.setFilter('category', cat)} style={{ padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.85rem', background: filters.categoryFilter === cat ? 'var(--accent-color)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{cat.charAt(0).toUpperCase() + cat.slice(1)}s</button>
              ))}
            </div>
            <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: showAdvancedFilters ? 'var(--surface-color)' : 'transparent', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}><Settings2 size={16} /> Filters</button>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setShowExotic(!showExotic)} style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.75rem', background: showExotic ? 'rgba(79, 70, 229, 0.2)' : 'transparent', color: 'white', cursor: 'pointer' }}>Exotic</button>
              <button onClick={() => { 
                const newState = !showPalatalized;
                setShowPalatalized(newState);
                setShowNasalized(newState);
                setShowDiphthongs(newState);
                setShowAspirated(newState);
              }} style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.75rem', background: showPalatalized ? 'rgba(79, 70, 229, 0.2)' : 'transparent', color: 'white', cursor: 'pointer' }}>Classes</button>
            </div>

            <button onClick={() => { setCompareMode(!compareMode); setCompareQueue([]); }} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: '8px', border: '1px solid var(--accent-color)', fontSize: '0.85rem', background: compareMode ? 'var(--accent-color)' : 'transparent', color: compareMode ? 'white' : 'var(--accent-color)', fontWeight: 700, cursor: 'pointer' }}><Columns size={16} /> Compare</button>
          </div>

          {showAdvancedFilters && (
            <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                <div><label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mode</label><select value={filters.matrixMode} onChange={(e) => filters.setFilter('mode', e.target.value)} style={{ width: '100%', background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '6px' }}><option value="symmetric">Symmetric</option><option value="v2c">Vowel → Consonant</option><option value="c2v">Consonant → Vowel</option></select></div>
                <div><label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Language</label><input list="languages" value={filters.languageFilter === 'all' ? '' : filters.languageFilter} placeholder="All" onChange={(e) => filters.setFilter('language', e.target.value || 'all')} style={{ width: '100%', background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '6px' }} /><datalist id="languages">{dataIndex?.stats.languages.map(l => <option key={l} value={l} />)}</datalist></div>
              </div>
            </div>
          )}

          <div className="matrix-wrapper">
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