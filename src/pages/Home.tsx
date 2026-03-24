import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
import './home.css';

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

  const handleMatrixKeyDown = (e: React.KeyboardEvent) => {
    const focusedElement = document.activeElement;
    if (!focusedElement || focusedElement.tagName !== 'TD') return;

    // We only care about Arrow keys
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

    const cells = Array.from(document.querySelectorAll('.ipa-table td[tabindex="0"]'));
    const currentIndex = cells.indexOf(focusedElement);
    if (currentIndex === -1) return;

    const colCount = colSymbols.length;
    let nextIndex = -1;

    switch (e.key) {
      case 'ArrowRight':
        nextIndex = currentIndex + 1;
        break;
      case 'ArrowLeft':
        nextIndex = currentIndex - 1;
        break;
      case 'ArrowDown':
        nextIndex = currentIndex + colCount;
        break;
      case 'ArrowUp':
        nextIndex = currentIndex - colCount;
        break;
    }

    if (nextIndex >= 0 && nextIndex < cells.length) {
      e.preventDefault();
      (cells[nextIndex] as HTMLElement).focus();
    }
  };

  if (loading) return <MatrixSkeleton />;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <Helmet>
        <title>EchoDrift | Atlas of Phonetic Shifts, Sound Changes & Allophones</title>
        <meta name="description" content="Explore 1600+ documented phonetic transformations, historical sound changes, and allophones across 90+ language families. An interactive IPA matrix for historical linguistics and phonology." />
        <meta name="keywords" content="phonetic shift, sound change, IPA matrix, historical linguistics, phonology, Grimm's Law, Great Vowel Shift, lenition, palatalization" />
        <link rel="canonical" href="https://echodrift.pages.dev/" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://echodrift.pages.dev/" />
        <meta property="og:title" content="EchoDrift | Atlas of Phonetic Shifts, Sound Changes & Allophones" />
        <meta property="og:description" content="Interactive atlas of phonetic transformations across 90+ language families. Explore sound shifts from Grimm's Law to Romance lenition via a clickable IPA matrix." />
        <meta property="og:image" content="https://echodrift.pages.dev/og-preview.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://echodrift.pages.dev/" />
        <meta name="twitter:title" content="EchoDrift | Atlas of Phonetic Shifts, Sound Changes & Allophones" />
        <meta name="twitter:description" content="Interactive atlas of phonetic transformations across 90+ language families. Explore sound shifts from Grimm's Law to Romance lenition." />
        <meta name="twitter:image" content="https://echodrift.pages.dev/og-preview.png" />
      </Helmet>
      {/* Navigation Tabs */}
      <div className="tabs-container" role="tablist" aria-label="Main View Tabs">
        <button 
          onClick={() => setActiveTab('matrix')} 
          className={`tab-button ${activeTab === 'matrix' ? 'active' : ''}`}
          role="tab"
          aria-selected={activeTab === 'matrix'}
        >
          <Grid3X3 size={18} /> Shift Matrix
        </button>
        <button 
          onClick={() => setActiveTab('landmarks')} 
          className={`tab-button ${activeTab === 'landmarks' ? 'active' : ''}`}
          role="tab"
          aria-selected={activeTab === 'landmarks'}
        >
          <Star size={18} /> Landmarks
        </button>
        <button 
          onClick={() => setActiveTab('stats')} 
          className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
          role="tab"
          aria-selected={activeTab === 'stats'}
        >
          <BarChart3 size={18} /> Atlas Health
        </button>
      </div>

      {activeTab === 'landmarks' && (
        <div className="landmarks-grid">
          {dataIndex?.transformations.filter(t => t.commonality === 5).slice(0, 16).map(t => {
            const [f, to] = t.id.split('_to_');
            return (
              <a 
                key={t.id} 
                onClick={() => navigate(`/transform/${f}/${to}`)} 
                className="landmark-card"
              >
                <div className="landmark-symbol">{f} → {to}</div>
                <div className="landmark-name">{t.name}</div>
              </a>
            );
          })}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Documented Shifts</div>
            <div className="stat-value" style={{ color: 'var(--accent-color)' }}>{documentedInFilter.length}</div>
            <div className="stat-note">Currently visible in your selection</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Matrix Coverage</div>
            <div className="stat-value" style={{ color: 'var(--success-color)' }}>{coveragePercent}%</div>
            <div className="stat-note">Percentage of researched sound pairs</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Research Health</div>
            <div className="stat-value">{researchHealth}</div>
            <div className="stat-note">Average examples per documented shift</div>
          </div>
        </div>
      )}

      {activeTab === 'matrix' && (
        <>
          <div className="matrix-controls">
            <div className="category-toggle">
              {['vowel', 'consonant', 'all'].map(cat => (
                <button 
                  key={cat} 
                  onClick={() => filters.setFilter('category', cat)} 
                  className={`category-btn ${filters.categoryFilter === cat ? 'active' : ''}`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}s
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} 
              className={`control-btn ${showAdvancedFilters ? 'active' : ''}`}
            >
              <Settings2 size={16} /> Filters
            </button>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setShowExotic(!showExotic)} 
                className="control-btn"
                style={{ background: showExotic ? 'rgba(79, 70, 229, 0.2)' : 'transparent' }}
              >
                Exotic
              </button>
              <button 
                onClick={() => { 
                  const newState = !showPalatalized;
                  setShowPalatalized(newState); setShowNasalized(newState); setShowDiphthongs(newState); setShowAspirated(newState);
                }} 
                className="control-btn"
                style={{ background: showPalatalized ? 'rgba(79, 70, 229, 0.2)' : 'transparent' }}
              >
                Classes
              </button>
            </div>

            <button 
              onClick={() => { setCompareMode(!compareMode); setCompareQueue([]); }} 
              className={`compare-btn ${compareMode ? 'active' : ''}`}
            >
              <Columns size={16} /> Compare
            </button>
          </div>

          {showAdvancedFilters && (
            <div className="advanced-filters">
              <div className="filters-grid">
                <div className="filter-group">
                  <label>Matrix Mode</label>
                  <select 
                    value={filters.matrixMode} 
                    onChange={(e) => filters.setFilter('mode', e.target.value)} 
                    className="filter-select"
                  >
                    <option value="symmetric">Symmetric</option>
                    <option value="v2c">Vowel → Consonant</option>
                    <option value="c2v">Consonant → Vowel</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Language</label>
                  <input 
                    list="languages" 
                    value={filters.languageFilter === 'all' ? '' : filters.languageFilter} 
                    placeholder="All" 
                    onChange={(e) => filters.setFilter('language', e.target.value || 'all')} 
                    className="filter-input"
                  />
                  <datalist id="languages">
                    {dataIndex?.stats.languages.map(l => <option key={l} value={l} />)}
                  </datalist>
                </div>
              </div>
            </div>
          )}

          <div className="matrix-wrapper">
            <table 
              className="ipa-table" 
              role="grid" 
              aria-label="Phonetic Transformation Matrix"
              onKeyDown={handleMatrixKeyDown}
            >
              <thead>
                <tr role="row">
                  <th className="row-header" role="columnheader">From \ To</th>
                  {colSymbols.map(s => <th key={s.id} role="columnheader">[{s.symbol}]</th>)}
                </tr>
              </thead>
              <tbody>
                {rowSymbols.map(rS => (
                  <tr key={rS.id} role="row">
                    <th className="row-header" role="rowheader">[{rS.symbol}]</th>
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