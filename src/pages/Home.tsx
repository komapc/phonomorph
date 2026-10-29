import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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

export type HomeTab = 'matrix' | 'landmarks' | 'stats';

const SITE = 'https://echodrift.lipu.dev';
// Each tab has its own path so it can be linked, bookmarked and indexed.
const TAB_PATHS: Record<HomeTab, string> = { matrix: '/', landmarks: '/landmarks', stats: '/stats' };

const Home = ({ tab = 'matrix' }: { tab?: HomeTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = tab;
  const { index: dataIndex, loading, unattested, ensureUnattested } = useData();
  useEffect(() => { ensureUnattested(); }, [ensureUnattested]);
  const symbols = useMemo(() => (dataIndex?.symbols || []) as IPASymbol[], [dataIndex]);

  const filters = useMatrixFilters();
  const [showExotic, setShowExotic] = useState(filters.searchParams.get('exotic') === 'true');
  const [showPalatalized, setShowPalatalized] = useState(filters.searchParams.get('pal') === 'true');
  const [showNasalized, setShowNasalized] = useState(filters.searchParams.get('nas') === 'true');
  const [showDiphthongs, setShowDiphthongs] = useState(filters.searchParams.get('dip') === 'true');
  const [showAspirated, setShowAspirated] = useState(filters.searchParams.get('asp') === 'true');
  const [compareMode, setCompareMode] = useState(false);
  const [compareQueue, setCompareQueue] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useSyncSpecialFiltersToURL(
    showExotic, showPalatalized, showNasalized, showDiphthongs, showAspirated,
    filters.collapseMode, filters.searchParams, filters.setSearchParams,
    activeTab === 'matrix'
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

  const shiftCount = dataIndex?.transformations.length ?? 0;
  const languageCount = dataIndex?.stats.languages.length ?? 0;
  const familyCount = dataIndex?.stats.families.length ?? 0;
  const symbolById = useMemo(() => new Map(symbols.map(s => [s.id, s.symbol])), [symbols]);
  const landmarks = useMemo(() => (dataIndex?.transformations || [])
    .filter(t => t.commonality === 5)
    .sort((a, b) => a.name.localeCompare(b.name)), [dataIndex]);

  const pageUrl = `${SITE}${TAB_PATHS[activeTab]}`;
  const atlasSummary = `${shiftCount} documented phonetic shifts across ${languageCount} languages and ${familyCount} language families and branches`;
  const head = {
    matrix: {
      title: 'EchoDrift | Atlas of Phonetic Shifts & Sound Changes',
      description: `Explore ${atlasSummary}. An interactive IPA matrix of historical sound changes and allophones.`,
      social: 'Interactive atlas of phonetic transformations. Explore sound shifts from Grimm\'s Law to Romance lenition via a clickable IPA matrix.',
    },
    landmarks: {
      title: 'Landmark Sound Changes | EchoDrift',
      description: `The ${landmarks.length} most widespread sound changes in the EchoDrift atlas, each attested in many unrelated language families: lenition, palatalization, debuccalization and more.`,
      social: 'The most widespread sound changes across the world\'s languages, from p → f to k → tʃ.',
    },
    stats: {
      title: 'Atlas Health | EchoDrift Coverage Statistics',
      description: `Live statistics for the EchoDrift atlas: ${atlasSummary}, with sources, allophones and IPA matrix coverage.`,
      social: 'How much of the sound-change matrix is documented: shifts, languages, families, sources and coverage.',
    },
  }[activeTab];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE}/#organization`,
        "name": "EchoDrift",
        "url": `${SITE}/`
      },
      {
        "@type": "WebSite",
        "@id": `${SITE}/#website`,
        "url": `${SITE}/`,
        "name": "EchoDrift",
        "description": "The Universal Atlas of Phonetic Evolution",
        "publisher": { "@id": `${SITE}/#organization` }
      },
      {
        "@type": "Dataset",
        "name": "EchoDrift Phonetic Transformation Database",
        "description": `A database of ${atlasSummary}.`,
        "url": `${SITE}/`,
        "license": "https://creativecommons.org/licenses/by/4.0/",
        "keywords": ["phonetics", "linguistics", "sound change", "IPA", "phonology"],
        "creator": { "@id": `${SITE}/#organization` }
      }
    ]
  };

  if (loading) return <MatrixSkeleton />;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <>
        <title>{head.title}</title>
        <meta name="description" content={head.description} />
        <link rel="canonical" href={pageUrl} />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={head.title} />
        <meta property="og:description" content={head.social} />
        <meta property="og:image" content={`${SITE}/og-preview.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pageUrl} />
        <meta name="twitter:title" content={head.title} />
        <meta name="twitter:description" content={head.social} />
        <meta name="twitter:image" content={`${SITE}/og-preview.png`} />
      </>
      <h1 style={{ position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>
        EchoDrift: Atlas of Phonetic Shifts, Sound Changes &amp; Allophones
      </h1>
      {/* Navigation Tabs */}
      <div className="tabs-container" role="tablist" aria-label="Main View Tabs">
        {([
          ['matrix', <Grid3X3 size={18} />, 'Shift Matrix'],
          ['landmarks', <Star size={18} />, 'Landmarks'],
          ['stats', <BarChart3 size={18} />, 'Atlas Health'],
        ] as const).map(([id, icon, label]) => (
          <Link
            key={id}
            // The matrix keeps its filter query string when you come back to it.
            to={id === 'matrix' ? { pathname: '/', search: location.search } : TAB_PATHS[id]}
            className={`tab-button ${activeTab === id ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === id}
          >
            {icon} {label}
          </Link>
        ))}
      </div>

      {activeTab === 'landmarks' && (
        <>
          <h2 className="tab-heading">Landmark sound changes</h2>
          <p className="tab-intro">
            The most widespread shifts in the atlas (commonality 5): each is attested in many unrelated language families.
          </p>
          <div className="landmarks-grid">
            {landmarks.map(t => {
              const [f, to] = t.id.split('_to_');
              return (
                <Link key={t.id} to={`/transform/${f}/${to}`} className="landmark-card">
                  <div className="landmark-symbol">{symbolById.get(f) ?? f} → {symbolById.get(to) ?? to}</div>
                  <div className="landmark-name">{t.name}</div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'stats' && (
        <>
          <h2 className="tab-heading">Atlas health</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Documented Shifts</div>
              <div className="stat-value" style={{ color: 'var(--accent-color)' }}>{shiftCount}</div>
              <div className="stat-note">{dataIndex?.stats.totalAllophones ?? 0} of them include allophony</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Languages</div>
              <div className="stat-value">{languageCount}</div>
              <div className="stat-note">In {familyCount} language families and branches</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Sources</div>
              <div className="stat-value">{dataIndex?.stats.totalSources ?? 0}</div>
              <div className="stat-note">Citations across all shifts</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Matrix Coverage</div>
              <div className="stat-value" style={{ color: 'var(--success-color)' }}>{coveragePercent}%</div>
              <div className="stat-note">Documented share of possible pairs in the default matrix view</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Research Health</div>
              <div className="stat-value">{researchHealth}</div>
              <div className="stat-note">Average examples per documented shift</div>
            </div>
          </div>
        </>
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
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Tip:</strong> You can search for phonetic features like <code>[+nasal]</code>, <code>[+voiced]</code>, or <code>[aspirated]</code> in the search bar.
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
                        unattested={unattested?.has(`${rS.id}_to_${cS.id}`) || false}
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

      {/* SEO Content Section */}
      <section style={{ marginTop: '5rem', borderTop: '1px solid var(--border-color)', paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center' }}>
            What is EchoDrift?
          </h2>
          <p style={{ fontSize: '1.2rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center' }}>
            EchoDrift is a universal atlas of <strong>phonetic evolution</strong>. It maps how speech sounds drift, shift, and mutate across human languages. 
            From the <em>Great Vowel Shift</em> in English to the <em>High German Consonant Shift</em>, our interactive IPA matrix provides a 
            data-driven perspective on the diachronic phonology of {languageCount} languages in {familyCount} language families and branches.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--accent-color)' }}>Phonetic Shifts</h3>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                Documented sound changes where one phoneme systematically replaces another over time. 
                Explore processes like <strong>lenition</strong>, <strong>palatalization</strong>, and <strong>debuccalization</strong>.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--accent-color)' }}>Allophonic Variation</h3>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                Synchronic variants of the same sound that occur in different environments. 
                Identified with the <strong>ALLO</strong> badge in our database.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--accent-color)' }}>Cross-Linguistic Data</h3>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                Evidence drawn from {shiftCount} documented transformations across Germanic, Romance, 
                Austronesian, Sino-Tibetan, and dozens of other language families.
              </p>
            </div>
          </div>
          
          <div style={{ marginTop: '4rem', textAlign: 'center' }}>
            <Link to="/about" style={{ display: 'inline-block', padding: '0.8rem 2rem', borderRadius: '100px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'white', textDecoration: 'none', fontWeight: 600 }}>
              Learn more about the Atlas methodology
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
