import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GITHUB_REPO } from '../data/loader';
import type { IPASymbol, TransformationMeta } from '../data/loader';
import { useData } from '../contexts/DataContext';
import MatrixCell from '../components/MatrixCell';
import { MatrixSkeleton } from '../components/MatrixSkeleton';
import { Columns } from 'lucide-react';
import {
  useMatrixFilters,
  useSymbolGrouping,
  useFilteredSymbols,
  useMatrixDimensions,
  useFilterOptions,
  useSyncSpecialFiltersToURL
} from '../hooks/useHomeMatrix';

const Home = () => {
  const navigate = useNavigate();
  const { index: dataIndex, loading, error, retry } = useData();
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

  // Sync special filters to URL
  useSyncSpecialFiltersToURL(
    showExotic, showPalatalized, showNasalized, showDiphthongs, showAspirated,
    filters.collapseMode, filters.searchParams, filters.setSearchParams
  );

  // Filter symbols using custom hook
  const filterState = {
    ...filters,
    showExotic, showPalatalized, showNasalized, showDiphthongs, showAspirated
  };
  const filteredSymbols = useFilteredSymbols(symbols, filterState);

  // Group symbols
  const groupSymbols = useSymbolGrouping(filters.collapseMode);

  // Calculate matrix dimensions
  const { rowSymbols, colSymbols } = useMatrixDimensions(filteredSymbols, filters.matrixMode, groupSymbols);

  // Get dropdown options
  const filterOptions = useFilterOptions(symbols);

  // Document stats
  const documentedInFilter = useMemo(() => {
    return dataIndex?.transformations.filter(t => {
      const [fromId, toId] = t.id.split('_to_');
      const inLanguage = filters.languageFilter === 'all' || t.languages?.includes(filters.languageFilter);
      return inLanguage && rowSymbols.some(s => s.id === fromId) && colSymbols.some(s => s.id === toId);
    }) || [];
  }, [dataIndex, rowSymbols, colSymbols, filters.languageFilter]);

  const allophonesInFilter = useMemo(() => {
    return documentedInFilter.filter(t => t.isAllophone).length;
  }, [documentedInFilter]);

  const totalPossible = rowSymbols.length * colSymbols.length - (filters.matrixMode === 'symmetric' ? rowSymbols.length : 0);
  const coveragePercent = totalPossible > 0 ? ((documentedInFilter.length / totalPossible) * 100).toFixed(1) : 0;

  const researchHealth = useMemo(() => {
    if (!dataIndex || dataIndex.transformations.length === 0) return '0.0';
    return (dataIndex.stats.totalExamples / dataIndex.transformations.length).toFixed(1);
  }, [dataIndex]);

  // Transformation logic
  const getTransformation = useCallback((fromId: string, toId: string) => {
    const fromSymbol = rowSymbols.find(s => s.id === fromId);
    const toSymbol = colSymbols.find(s => s.id === toId);

    if (fromSymbol && 'isGroup' in fromSymbol || (toSymbol && 'isGroup' in toSymbol)) {
      const froms = (fromSymbol && 'isGroup' in fromSymbol) ? fromSymbol.originalSymbols : [fromSymbol as IPASymbol];
      const tos = (toSymbol && 'isGroup' in toSymbol) ? toSymbol.originalSymbols : [toSymbol as IPASymbol];

      const documented = dataIndex?.transformations.filter(t => {
        const [fid, tid] = t.id.split('_to_');
        const inLanguage = filters.languageFilter === 'all' || t.languages?.includes(filters.languageFilter);
        return inLanguage && froms.some(fs => fs.id === fid) && tos.some(ts => ts.id === tid);
      }) || [];

      if (documented.length > 0) {
        return {
          id: `${fromId}_to_${toId}`,
          name: `${documented.length} shifts`,
          commonality: Math.max(...documented.map(d => d.commonality)),
          isGroup: true,
          count: documented.length
        } as unknown as TransformationMeta;
      }
      return undefined;
    }

    const t = dataIndex?.transformations.find(t => t.id === `${fromId}_to_${toId}`);
    if (t && (filters.languageFilter === 'all' || t.languages?.includes(filters.languageFilter))) {
      return t;
    }
    return undefined;
  }, [dataIndex, rowSymbols, colSymbols, filters.languageFilter]);

  const hasTransformation = useCallback((fromId: string, toId: string) => {
    return !!getTransformation(fromId, toId);
  }, [getTransformation]);

  const isUnattested = useCallback((fromId: string, toId: string) => {
    const fromSymbol = rowSymbols.find(s => s.id === fromId);
    const toSymbol = colSymbols.find(s => s.id === toId);

    if ((fromSymbol && 'isGroup' in fromSymbol) || (toSymbol && 'isGroup' in toSymbol)) return false;

    return dataIndex?.unattested?.includes(`${fromId}_to_${toId}`);
  }, [rowSymbols, colSymbols, dataIndex?.unattested]);

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

    const fromSymbol = rowSymbols.find(s => s.id === fromId);
    const toSymbol = colSymbols.find(s => s.id === toId);

    if ((fromSymbol && 'isGroup' in fromSymbol) || (toSymbol && 'isGroup' in toSymbol)) {
      const newParams = new URLSearchParams(filters.searchParams);
      newParams.delete('collapse');
      if (fromSymbol && 'isGroup' in fromSymbol) newParams.set(filters.collapseMode, fromId);
      if (toSymbol && 'isGroup' in toSymbol) newParams.set(filters.collapseMode, toId);
      filters.setSearchParams(newParams);
      return;
    }

    if (hasTransformation(fromId, toId)) {
      navigate(`/transform/${fromId}/${toId}`);
    } else {
      window.open(`https://github.com/${GITHUB_REPO}/new/master/public/data/transformations?filename=${fromId}_to_${toId}.json`, '_blank');
    }
  }, [compareMode, compareQueue, navigate, rowSymbols, colSymbols, filters, hasTransformation]);

  const getCommonalityColor = useCallback((commonality: number, isActive: boolean) => {
    if (!isActive) return 'transparent';
    const opacities = [0.1, 0.2, 0.35, 0.5, 0.7];
    return `rgba(79, 70, 229, ${opacities[commonality - 1]})`;
  }, []);

  // Loading state
  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ height: '40px', background: 'var(--surface-color)', borderRadius: '8px', animation: 'shimmer 2s infinite' }} />
        </div>
        <MatrixSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="error-container" style={{ padding: '3rem 2rem', maxWidth: '500px', margin: '3rem auto' }}>
        <h2 style={{ color: 'var(--accent-color)', marginBottom: '1rem' }}>Unable to Load Atlas</h2>
        <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
          {error}
        </p>
        <button onClick={retry} className="btn btn-primary">
          🔄 Try Again
        </button>
      </div>
    );
  }

  // Main render
  return (
    <div>
      {/* Stats Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Documented Shifts</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-color)' }}>{documentedInFilter.length} <span style={{ fontSize: '0.65rem', fontWeight: 400, color: 'var(--text-secondary)' }}>in view</span></div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{dataIndex?.transformations.length} total in atlas</div>
        </div>
        <div style={{ background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Allophonic Pairs</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success-color)' }}>{allophonesInFilter} <span style={{ fontSize: '0.65rem', fontWeight: 400, color: 'var(--text-secondary)' }}>in view</span></div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{dataIndex?.stats.totalAllophones} total in atlas</div>
        </div>
        <div style={{ background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Examples</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{dataIndex?.stats.totalExamples}</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Across all shifts</div>
        </div>
        <div style={{ background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Academic Sources</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{dataIndex?.stats.totalSources}</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Verified citations</div>
        </div>
        <div style={{ background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Matrix Coverage</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success-color)' }}>{coveragePercent}%</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Of current selection</div>
        </div>
        <div style={{ background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Research Health</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{researchHealth}</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Avg examples / shift</div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', background: 'rgba(79, 70, 229, 0.4)', border: '1px solid var(--accent-color)', borderRadius: '3px' }}></div>
          <span style={{ color: 'var(--text-secondary)' }}>Documented Shift (Color = Commonality)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <div style={{ padding: '1px 4px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--success-color)', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 800, color: 'var(--success-color)' }}>ALLO</div>
          <span style={{ color: 'var(--text-secondary)' }}>Allophonic relationship</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem' }}>← Name</span>
          <span style={{ color: 'var(--text-secondary)' }}>Reverse shift exists</span>
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
            <select value={filters.matrixMode} onChange={(e) => filters.setFilter('mode', e.target.value)} style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}>
              <option value="symmetric">Symmetric (Same Axes)</option>
              <option value="v2c">Vowel → Consonant</option>
              <option value="c2v">Consonant → Vowel</option>
            </select>
          </div>

          <div className="filter-item">
            <label style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Collapse</label>
            <select value={filters.collapseMode} onChange={(e) => filters.setFilter('collapse', e.target.value)} style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}>
              <option value="none">None (Individual Sounds)</option>
              <option value="manner">By Manner</option>
              <option value="place">By Place</option>
              <option value="height">By Height</option>
              <option value="backness">By Backness</option>
            </select>
          </div>

          {filters.matrixMode === 'symmetric' && (
            <>
              <div className="filter-item">
                <label style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Category</label>
                <div style={{ display: 'flex', background: 'var(--bg-color)', padding: '0.2rem', borderRadius: '8px' }}>
                  {['all', 'consonant', 'vowel'].map(cat => (
                    <button key={cat} onClick={() => filters.setFilter('category', cat)} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', background: filters.categoryFilter === cat ? 'var(--accent-color)' : 'transparent', color: 'white' }}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-item">
                <label style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Language</label>
                <input list="languages" value={filters.languageFilter === 'all' ? '' : filters.languageFilter} placeholder="All Languages" onChange={(e) => filters.setFilter('language', e.target.value || 'all')} style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem', width: '150px' }} />
                <datalist id="languages">
                  {[...(dataIndex?.stats.languages || [])].sort().map(l => <option key={l} value={l} />)}
                </datalist>
              </div>

              <div className="filter-item">
                <label style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Family</label>
                <select value={filters.familyFilter} onChange={(e) => filters.setFilter('family', e.target.value)} style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <option value="all">All Families</option>
                  {filterOptions.familyOptions.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="filter-item">
                <label style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Manner</label>
                <select value={filters.mannerFilter} onChange={(e) => filters.setFilter('manner', e.target.value)} style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <option value="all">All Manners</option>
                  {filterOptions.mannerOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="filter-item">
                <label style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Place</label>
                <select value={filters.placeFilter} onChange={(e) => filters.setFilter('place', e.target.value)} style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <option value="all">All Places</option>
                  {filterOptions.placeOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="filter-item">
                <label style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Height</label>
                <select value={filters.heightFilter} onChange={(e) => filters.setFilter('height', e.target.value)} style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <option value="all">All Heights</option>
                  {filterOptions.heightOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="filter-item">
                <label style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Backness</label>
                <select value={filters.backnessFilter} onChange={(e) => filters.setFilter('backness', e.target.value)} style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <option value="all">All Backness</option>
                  {filterOptions.backnessOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="filter-item">
                <label style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Voicing</label>
                <select value={filters.voicedFilter} onChange={(e) => filters.setFilter('voiced', e.target.value)} style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <option value="all">All</option>
                  <option value="true">Voiced Only</option>
                  <option value="false">Voiceless Only</option>
                </select>
              </div>
            </>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => { setCompareMode(!compareMode); setCompareQueue([]); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--accent-color)', fontSize: '0.75rem', background: compareMode ? 'var(--accent-color)' : 'transparent', color: compareMode ? 'white' : 'var(--accent-color)', fontWeight: 700, transition: 'all 0.2s ease', marginRight: '1rem' }}>
              <Columns size={14} /> {compareMode ? `Select 2 (${compareQueue.length}/2)` : 'Compare Shifts'}
            </button>

            {[
              { label: 'Exotic', state: showExotic, setter: setShowExotic },
              { label: 'Palatalized', state: showPalatalized, setter: setShowPalatalized },
              { label: 'Nasalized', state: showNasalized, setter: setShowNasalized },
              { label: 'Diphthongs', state: showDiphthongs, setter: setShowDiphthongs },
              { label: 'Aspirated', state: showAspirated, setter: setShowAspirated },
            ].map(btn => (
              <button key={btn.label} onClick={() => btn.setter(!btn.state)} style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.75rem', background: btn.state ? 'rgba(79, 70, 229, 0.2)' : 'var(--surface-color)', color: btn.state ? 'var(--accent-color)' : 'white', fontWeight: btn.state ? 700 : 400, transition: 'all 0.2s ease' }}>
                {btn.label}
              </button>
            ))}
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
                {colSymbols.map(colSymbol => (
                  <MatrixCell
                    key={colSymbol.id}
                    rowSymbol={rowSymbol as IPASymbol}
                    colSymbol={colSymbol as IPASymbol}
                    isDiagonal={rowSymbol.id === colSymbol.id}
                    details={getTransformation(rowSymbol.id, colSymbol.id)}
                    inverseDetails={getTransformation(colSymbol.id, rowSymbol.id)}
                    unattested={isUnattested(rowSymbol.id, colSymbol.id) || false}
                    getCommonalityColor={getCommonalityColor}
                    handleCellClick={handleCellClick}
                    highlighted={compareQueue.includes(`${rowSymbol.id}_to_${colSymbol.id}`)}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Home;
