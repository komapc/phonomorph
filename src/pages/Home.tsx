import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GITHUB_REPO } from '../data/loader';
import type { IPASymbol, IPASymbolMeta, TransformationMeta } from '../data/loader';
import { useData } from '../contexts/DataContext';
import MatrixCell from '../components/MatrixCell';
import { MatrixSkeleton } from '../components/MatrixSkeleton';
import { Columns } from 'lucide-react';

interface SymbolGroup extends IPASymbolMeta {
  isGroup: true;
  originalSymbols: IPASymbol[];
}

type MatrixSymbol = (IPASymbol & { isZero?: boolean }) | SymbolGroup;

const Home = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State from URL or defaults
  const categoryFilter = (searchParams.get('category') || 'all') as 'all' | 'vowel' | 'consonant';
  const mannerFilter = searchParams.get('manner') || 'all';
  const placeFilter = searchParams.get('place') || 'all';
  const heightFilter = searchParams.get('height') || 'all';
  const backnessFilter = searchParams.get('backness') || 'all';
  const familyFilter = searchParams.get('family') || 'all';
  const languageFilter = searchParams.get('language') || 'all';
  const voicedFilter = searchParams.get('voiced') || 'all';
  const matrixMode = (searchParams.get('mode') || 'symmetric') as 'symmetric' | 'v2c' | 'c2v';
  const collapseMode = (searchParams.get('collapse') || 'none') as 'none' | 'manner' | 'place' | 'height' | 'backness';
  const [showExotic, setShowExotic] = useState(searchParams.get('exotic') === 'true');
  const [showPalatalized, setShowPalatalized] = useState(searchParams.get('pal') === 'true');
  const [showNasalized, setShowNasalized] = useState(searchParams.get('nas') === 'true');
  const [showDiphthongs, setShowDiphthongs] = useState(searchParams.get('dip') === 'true');
  const [showAspirated, setShowAspirated] = useState(searchParams.get('asp') === 'true');

  // Get data from global context
  const { index: dataIndex, loading, error, retry } = useData();
  const symbols = (dataIndex?.symbols || []) as IPASymbol[];

  // Compare Mode State
  const [compareMode, setCompareMode] = useState(false);
  const [compareQueue, setCompareQueue] = useState<string[]>([]);

  // Update URL when filters change
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (showExotic) newParams.set('exotic', 'true'); else newParams.delete('exotic');
    if (showPalatalized) newParams.set('pal', 'true'); else newParams.delete('pal');
    if (showNasalized) newParams.set('nas', 'true'); else newParams.delete('nas');
    if (showDiphthongs) newParams.set('dip', 'true'); else newParams.delete('dip');
    if (showAspirated) newParams.set('asp', 'true'); else newParams.delete('asp');
    if (collapseMode !== 'none') newParams.set('collapse', collapseMode); else newParams.delete('collapse');
    setSearchParams(newParams);
  }, [showExotic, showPalatalized, showNasalized, showDiphthongs, showAspirated, collapseMode, searchParams, setSearchParams]);

  const setFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all' || value === 'symmetric') newParams.delete(key);
    else newParams.set(key, value);
    setSearchParams(newParams);
  };

  const filteredSymbols = useMemo(() => {
    return symbols.filter(s => {
      const typeMatch = categoryFilter === 'all' || s.category === categoryFilter;
      const mannerMatch = mannerFilter === 'all' || s.manner === mannerFilter;
      const placeMatch = placeFilter === 'all' || s.place === placeFilter;
      const heightMatch = heightFilter === 'all' || s.height === heightFilter;
      const backnessMatch = backnessFilter === 'all' || s.backness === backnessFilter;
      const familyMatch = familyFilter === 'all' || s.family === familyFilter;
      
      let voicedMatch = true;
      if (voicedFilter !== 'all') {
        const isVoiced = s.name.toLowerCase().includes('voiced');
        voicedMatch = voicedFilter === 'true' ? isVoiced : !isVoiced;
      }

      // Visibility logic for special classes
      if (s.isPalatalized && !showPalatalized) return false;
      if (s.isNasalized && !showNasalized) return false;
      if (s.isDiphthong && !showDiphthongs) return false;
      if (s.isAspirated && !showAspirated) return false;

      // Exotic filter: only hides sounds that are NOT in a toggled special class
      const isSpecialActive = (s.isPalatalized && showPalatalized) || (s.isNasalized && showNasalized) || (s.isDiphthong && showDiphthongs) || (s.isAspirated && showAspirated);
      if (s.isExotic && !showExotic && !isSpecialActive) return false;

      return typeMatch && mannerMatch && placeMatch && heightMatch && backnessMatch && voicedMatch && familyMatch;
    });
  }, [symbols, categoryFilter, mannerFilter, placeFilter, heightFilter, backnessFilter, familyFilter, voicedFilter, showExotic, showPalatalized, showNasalized, showDiphthongs, showAspirated]);

  const groupSymbols = useCallback((syms: (IPASymbol & { isZero?: boolean })[]): MatrixSymbol[] => {
    if (collapseMode === 'none') return syms;
    
    const groups: Record<string, IPASymbol[]> = {};
    syms.forEach(s => {
      const key = (s as unknown as Record<string, string>)[collapseMode] || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

    return Object.entries(groups).map(([name, members]) => ({
      id: name,
      symbol: name.substring(0, 3).toUpperCase(),
      name: `${name} (${members.length} sounds)`,
      category: members[0].category,
      isGroup: true,
      originalSymbols: members
    }) as SymbolGroup);
  }, [collapseMode]);

  const rowSymbols = useMemo(() => {
    let base: (IPASymbol & { isZero?: boolean })[];
    if (matrixMode === 'v2c') base = filteredSymbols.filter(s => s.category === 'vowel' || (s as { isZero?: boolean }).isZero);
    else if (matrixMode === 'c2v') base = filteredSymbols.filter(s => s.category === 'consonant' || (s as { isZero?: boolean }).isZero);
    else base = filteredSymbols;

    return groupSymbols(base);
  }, [matrixMode, filteredSymbols, groupSymbols]);

  const colSymbols = useMemo(() => {
    let base: (IPASymbol & { isZero?: boolean })[];
    if (matrixMode === 'v2c') base = filteredSymbols.filter(s => s.category === 'consonant' || (s as { isZero?: boolean }).isZero);
    else if (matrixMode === 'c2v') base = filteredSymbols.filter(s => s.category === 'vowel' || (s as { isZero?: boolean }).isZero);
    else base = filteredSymbols;

    return groupSymbols(base);
  }, [matrixMode, filteredSymbols, groupSymbols]);

  // Options for dropdowns
  const mannerOptions = useMemo(() => {
    const manners = new Set(symbols.map(s => s.manner).filter(Boolean));
    return Array.from(manners).sort() as string[];
  }, [symbols]);

  const placeOptions = useMemo(() => {
    const places = new Set(symbols.map(s => s.place).filter(Boolean));
    return Array.from(places).sort() as string[];
  }, [symbols]);

  const heightOptions = useMemo(() => {
    const heights = new Set(symbols.map(s => s.height).filter(Boolean));
    return Array.from(heights).sort() as string[];
  }, [symbols]);

  const backnessOptions = useMemo(() => {
    const backness = new Set(symbols.map(s => s.backness).filter(Boolean));
    return Array.from(backness).sort() as string[];
  }, [symbols]);

  const familyOptions = useMemo(() => {
    const families = new Set(symbols.map(s => s.family).filter(Boolean));
    return Array.from(families).sort() as string[];
  }, [symbols]);

  const documentedInFilter = useMemo(() => {
    return dataIndex?.transformations.filter(t => {
      const [fromId, toId] = t.id.split('_to_');
      const inLanguage = languageFilter === 'all' || t.languages?.includes(languageFilter);
      return inLanguage && rowSymbols.some(s => s.id === fromId) && colSymbols.some(s => s.id === toId);
    }) || [];
  }, [dataIndex, rowSymbols, colSymbols, languageFilter]);

  const allophonesInFilter = useMemo(() => {
    return documentedInFilter.filter(t => t.isAllophone).length;
  }, [documentedInFilter]);

  const totalPossible = rowSymbols.length * colSymbols.length - (matrixMode === 'symmetric' ? rowSymbols.length : 0);
  const coveragePercent = totalPossible > 0 ? ((documentedInFilter.length / totalPossible) * 100).toFixed(1) : 0;

  const researchHealth = useMemo(() => {
    if (!dataIndex || dataIndex.transformations.length === 0) return '0.0';
    return (dataIndex.stats.totalExamples / dataIndex.transformations.length).toFixed(1);
  }, [dataIndex]);

  const getTransformation = useCallback((fromId: string, toId: string) => {
    const fromSymbol = rowSymbols.find(s => s.id === fromId);
    const toSymbol = colSymbols.find(s => s.id === toId);

    if (fromSymbol && 'isGroup' in fromSymbol || (toSymbol && 'isGroup' in toSymbol)) {
      const froms = (fromSymbol && 'isGroup' in fromSymbol) ? fromSymbol.originalSymbols : [fromSymbol as IPASymbol];
      const tos = (toSymbol && 'isGroup' in toSymbol) ? toSymbol.originalSymbols : [toSymbol as IPASymbol];
      
      const documented = dataIndex?.transformations.filter(t => {
        const [fid, tid] = t.id.split('_to_');
        const inLanguage = languageFilter === 'all' || t.languages?.includes(languageFilter);
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
    if (t && (languageFilter === 'all' || t.languages?.includes(languageFilter))) {
      return t;
    }
    return undefined;
  }, [dataIndex, rowSymbols, colSymbols, languageFilter]);

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
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('collapse');
      if (fromSymbol && 'isGroup' in fromSymbol) newParams.set(collapseMode, fromId);
      if (toSymbol && 'isGroup' in toSymbol) newParams.set(collapseMode, toId);
      setSearchParams(newParams);
      return;
    }

    if (hasTransformation(fromId, toId)) {
      navigate(`/transform/${fromId}/${toId}`);
    } else {
      window.open(`https://github.com/${GITHUB_REPO}/new/master/public/data/transformations?filename=${fromId}_to_${toId}.json`, '_blank');
    }
  }, [compareMode, compareQueue, navigate, rowSymbols, colSymbols, searchParams, collapseMode, setSearchParams, hasTransformation]);

  const getCommonalityColor = useCallback((commonality: number, isActive: boolean) => {
    if (!isActive) return 'transparent';
    const opacities = [0.1, 0.2, 0.35, 0.5, 0.7];
    return `rgba(79, 70, 229, ${opacities[commonality - 1]})`;
  }, []);

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

  if (error) {
    return (
      <div className="error-container" style={{ padding: '3rem 2rem', maxWidth: '500px', margin: '3rem auto' }}>
        <h2 style={{ color: 'var(--accent-color)', marginBottom: '1rem' }}>Unable to Load Atlas</h2>
        <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
          {error}
        </p>
        <button
          onClick={retry}
          className="btn btn-primary"
        >
          🔄 Try Again
        </button>
      </div>
    );
  }

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

          <div className="filter-item">
            <label style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Collapse</label>
            <select 
              value={collapseMode} 
              onChange={(e) => setFilter('collapse', e.target.value)}
              style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}
            >
              <option value="none">None (Individual Sounds)</option>
              <option value="manner">By Manner</option>
              <option value="place">By Place</option>
              <option value="height">By Height</option>
              <option value="backness">By Backness</option>
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
                <label style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Language</label>
                <input 
                  list="languages" 
                  value={languageFilter === 'all' ? '' : languageFilter}
                  placeholder="All Languages"
                  onChange={(e) => setFilter('language', e.target.value || 'all')}
                  style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem', width: '150px' }}
                />
                <datalist id="languages">
                  {[...(dataIndex?.stats.languages || [])].sort().map(l => <option key={l} value={l} />)}
                </datalist>
              </div>

              <div className="filter-item">
                <label style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Family</label>
                <select 
                  value={familyFilter} 
                  onChange={(e) => setFilter('family', e.target.value)}
                  style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}
                >
                  <option value="all">All Families</option>
                  {familyOptions.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
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
                <label style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Place</label>
                <select 
                  value={placeFilter} 
                  onChange={(e) => setFilter('place', e.target.value)}
                  style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}
                >
                  <option value="all">All Places</option>
                  {placeOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="filter-item">
                <label style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Height</label>
                <select 
                  value={heightFilter} 
                  onChange={(e) => setFilter('height', e.target.value)}
                  style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}
                >
                  <option value="all">All Heights</option>
                  {heightOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="filter-item">
                <label style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Backness</label>
                <select 
                  value={backnessFilter} 
                  onChange={(e) => setFilter('backness', e.target.value)}
                  style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}
                >
                  <option value="all">All Backness</option>
                  {backnessOptions.map(m => <option key={m} value={m}>{m}</option>)}
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

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              onClick={() => {
                setCompareMode(!compareMode);
                setCompareQueue([]);
              }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.4rem 0.75rem', 
                borderRadius: '8px', 
                border: '1px solid var(--accent-color)', 
                fontSize: '0.75rem',
                background: compareMode ? 'var(--accent-color)' : 'transparent',
                color: compareMode ? 'white' : 'var(--accent-color)',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                marginRight: '1rem'
              }}
            >
              <Columns size={14} /> {compareMode ? `Select 2 (${compareQueue.length}/2)` : 'Compare Shifts'}
            </button>

            {[
              { label: 'Exotic', state: showExotic, setter: setShowExotic },
              { label: 'Palatalized', state: showPalatalized, setter: setShowPalatalized },
              { label: 'Nasalized', state: showNasalized, setter: setShowNasalized },
              { label: 'Diphthongs', state: showDiphthongs, setter: setShowDiphthongs },
              { label: 'Aspirated', state: showAspirated, setter: setShowAspirated },
            ].map(btn => (
              <button 
                key={btn.label}
                onClick={() => btn.setter(!btn.state)}
                style={{ 
                  padding: '0.4rem 0.75rem', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color)', 
                  fontSize: '0.75rem',
                  background: btn.state ? 'rgba(79, 70, 229, 0.2)' : 'var(--surface-color)',
                  color: btn.state ? 'var(--accent-color)' : 'white',
                  fontWeight: btn.state ? 700 : 400,
                  transition: 'all 0.2s ease'
                }}
              >
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
