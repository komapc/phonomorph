import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import type { IPASymbol } from '../data/loader';
import { useData } from '../contexts/DataContext';
import MatrixCell from '../components/MatrixCell';
import { MatrixSkeleton } from '../components/MatrixSkeleton';
import { HomeIntro } from '../components/HomeIntro';
import { LandmarkGrid } from '../components/LandmarkGrid';
import { landmarkItems } from '../data/transformPayload';
import type { AtlasStats } from '../components/HomeIntro';
import { usePagePayload } from '../contexts/PagePayloadContext';
import { Columns, Settings2, BarChart3, Grid3X3, Star, HelpCircle, AudioLines, RotateCcw } from 'lucide-react';
import SoundToggles from '../components/SoundToggles';
import { parseRareParam, serializeRareParam, isSymbolToggledOn, CLASS_GROUPS } from '../utils/soundGroups';
import type { ClassToggles, RareGroupId } from '../utils/soundGroups';
import MatrixLegend from '../components/MatrixLegend';
import {
  useMatrixFilters,
  useSymbolGrouping,
  useFilteredSymbols,
  useMatrixDimensions,
  useFilterOptions,
  FEATURE_FILTER_KEYS,
} from '../hooks/useHomeMatrix';

export type HomeTab = 'matrix' | 'landmarks' | 'stats';

const SITE = 'https://echodrift.lipu.dev';
// Each tab has its own path so it can be linked, bookmarked and indexed.
const TAB_PATHS: Record<HomeTab, string> = { matrix: '/', landmarks: '/landmarks', stats: '/stats' };

const Home = ({ tab = 'matrix' }: { tab?: HomeTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = tab;
  const { index: dataIndex, loading, unattested, ensureUnattested } = useData();
  const embedded = usePagePayload();
  useEffect(() => { ensureUnattested(); }, [ensureUnattested]);
  const symbols = useMemo(() => (dataIndex?.symbols || []) as IPASymbol[], [dataIndex]);

  const filters = useMatrixFilters();
  // Sound toggles are derived from the URL (single source of truth).
  const exoticParam = filters.searchParams.get('exotic');
  const rareGroups = useMemo(() => parseRareParam(exoticParam), [exoticParam]);
  const classKey = CLASS_GROUPS.map(g => filters.searchParams.get(g.id) === 'true' ? '1' : '0').join('');
  const classToggles = useMemo(() => Object.fromEntries(
    CLASS_GROUPS.map((g, i) => [g.id, classKey[i] === '1'])
  ) as ClassToggles, [classKey]);
  const [showSounds, setShowSounds] = useState(false);
  const [soundsNotice, setSoundsNotice] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [compareQueue, setCompareQueue] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Write sound toggles to the URL. If the sounds just switched on are all
  // outside the current Vowels/Consonants view, switch the view so they appear.
  const applySounds = (nextRare: ReadonlySet<RareGroupId>, nextClasses: ClassToggles) => {
    const added = symbols.filter(s =>
      isSymbolToggledOn(s, nextRare, nextClasses) && !isSymbolToggledOn(s, rareGroups, classToggles));
    const cat = filters.categoryFilter;
    let switchTo: 'vowel' | 'consonant' | 'all' | null = null;
    if (cat !== 'all' && added.length > 0 && !added.some(s => s.category === cat)) {
      const cats = new Set(added.map(s => s.category));
      switchTo = cats.size === 1 ? [...cats][0] : 'all';
    }
    setSoundsNotice(switchTo ? `Switched to ${switchTo === 'all' ? 'all sounds' : `${switchTo}s`} so the new rows and columns are visible.` : '');
    filters.updateParams(p => {
      const rare = serializeRareParam(nextRare);
      if (rare) p.set('exotic', rare); else p.delete('exotic');
      for (const g of CLASS_GROUPS) {
        if (nextClasses[g.id]) p.set(g.id, 'true'); else p.delete(g.id);
      }
      if (switchTo) {
        if (switchTo === 'vowel') p.delete('category'); else p.set('category', switchTo);
      }
    });
  };

  const filterState = {
    ...filters,
    rareGroups, classToggles
  };
  const showConsonantFilters = filters.categoryFilter !== 'vowel' || filters.matrixMode !== 'symmetric';
  const showVowelFilters = filters.categoryFilter !== 'consonant' || filters.matrixMode !== 'symmetric';
  // Shifts shown in the matrix: all, or only those attested in the chosen language.
  const shiftById = useMemo(() => new Map((dataIndex?.transformations || [])
    .filter(t => filters.languageFilter === 'all' || t.languages?.includes(filters.languageFilter))
    .map(t => [t.id, t])), [dataIndex, filters.languageFilter]);
  const activeFeatureFilters = FEATURE_FILTER_KEYS.filter(k => filters.searchParams.has(k)).length;
  const resetFeatureFilters = () => filters.updateParams(p => FEATURE_FILTER_KEYS.forEach(k => p.delete(k)));
  // Options come from the sounds currently switched on, so no choice leads to an empty matrix.
  const toggledSymbols = useMemo(
    () => symbols.filter(s => isSymbolToggledOn(s, rareGroups, classToggles)),
    [symbols, rareGroups, classToggles]
  );
  const options = useFilterOptions(toggledSymbols);
  const soundsOnCount = rareGroups.size + CLASS_GROUPS.filter(g => classToggles[g.id]).length;
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
  const languageCount = dataIndex?.stats.languageCount ?? 0;
  const familyCount = dataIndex?.stats.families.length ?? 0;
  const symbolById = useMemo(() => new Map(symbols.map(s => [s.id, s.symbol])), [symbols]);
  const landmarks = useMemo(() => landmarkItems(dataIndex?.transformations || [], id => symbolById.get(id) ?? id),
    [dataIndex, symbolById]);

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
        "alternateName": ["EchoDrift Atlas", "EchoDrift — Atlas of Phonetic Shifts"],
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

  // The prerendered home (dist/index.html) is rendered in this loading state with
  // the totals embedded as a payload, so hydration sees the same numbers.
  const atlasStats: AtlasStats | null = dataIndex
    ? { shifts: shiftCount, languages: languageCount, families: familyCount }
    : embedded?.kind === 'home'
      ? embedded
      : null;
  const pageHeading = (
    <h1 style={{ position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>
      EchoDrift: Atlas of Phonetic Shifts, Sound Changes &amp; Allophones
    </h1>
  );
  // Before the index loads (and in the prerendered HTML) the landmarks come
  // from the embedded payload, so they are in the page without JavaScript.
  const landmarkList = dataIndex ? landmarks : embedded?.kind === 'home' ? embedded.landmarks ?? [] : [];
  const intro = activeTab === 'matrix' && <HomeIntro stats={atlasStats} landmarks={landmarkList} />;
  const landmarksSection = (
    <>
      <h2 className="tab-heading">Landmark sound changes</h2>
      <p className="tab-intro">
        The most widespread shifts in the atlas (commonality 5): each is attested in many unrelated language families.
      </p>
      <LandmarkGrid items={landmarkList} />
    </>
  );

  if (loading) {
    return (
      <div>
        {pageHeading}
        {activeTab === 'landmarks' && landmarkList.length > 0 ? landmarksSection : <MatrixSkeleton />}
        {intro}
      </div>
    );
  }

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
      {pageHeading}
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
            title={TAB_HINTS[id]}
          >
            {icon} {label}
          </Link>
        ))}
      </div>

      {activeTab === 'landmarks' && landmarksSection}

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
                  title={CONTROL_HINTS.category}
                  aria-pressed={filters.categoryFilter === cat}
                >
                  {cat === 'all' ? 'All' : `${cat.charAt(0).toUpperCase() + cat.slice(1)}s`}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} 
              className={`control-btn ${showAdvancedFilters ? 'active' : ''}`}
              title={CONTROL_HINTS.filters}
              aria-expanded={showAdvancedFilters}
              aria-controls="matrix-filters"
            >
              <Settings2 size={16} /> Filters
              {activeFeatureFilters > 0 && <span className="control-badge" aria-label={`${activeFeatureFilters} active`}>{activeFeatureFilters}</span>}
            </button>
            
            <button
              onClick={() => setShowSounds(!showSounds)}
              className={`control-btn ${showSounds ? 'active' : ''}`}
              title={CONTROL_HINTS.sounds}
              aria-expanded={showSounds}
              aria-controls="sound-toggles"
            >
              <AudioLines size={16} /> Sounds
              {soundsOnCount > 0 && <span className="control-badge" aria-label={`${soundsOnCount} enabled`}>{soundsOnCount}</span>}
            </button>

            <button 
              onClick={() => { setCompareMode(!compareMode); setCompareQueue([]); }} 
              className={`compare-btn ${compareMode ? 'active' : ''}`}
              title={CONTROL_HINTS.compare}
              aria-pressed={compareMode}
            >
              <Columns size={16} /> Compare
            </button>

            <button
              onClick={() => setShowHelp(!showHelp)}
              className={`control-btn ${showHelp ? 'active' : ''}`}
              aria-expanded={showHelp}
              aria-controls="matrix-help"
              title="What do these controls mean?"
            >
              <HelpCircle size={16} /> Help
            </button>
          </div>

          {showHelp && (
            <dl id="matrix-help" className="controls-help">
              <dt>Shift Matrix</dt><dd>{TAB_HINTS.matrix}</dd>
              <dt>Landmarks</dt><dd>{TAB_HINTS.landmarks}</dd>
              <dt>Atlas Health</dt><dd>{TAB_HINTS.stats}</dd>
              <dt>Vowels / Consonants / All</dt><dd>{CONTROL_HINTS.category}</dd>
              <dt>Filters</dt><dd>{CONTROL_HINTS.filters}</dd>
              <dt>Sounds</dt><dd>{CONTROL_HINTS.sounds}</dd>
              <dt>Compare</dt><dd>{CONTROL_HINTS.compare}</dd>
            </dl>
          )}

          {showSounds && (
            <SoundToggles
              id="sound-toggles" symbols={symbols}
              rareGroups={rareGroups} classToggles={classToggles}
              onRareChange={next => applySounds(next, classToggles)}
              onClassChange={next => applySounds(rareGroups, next)}
              notice={soundsNotice}
            />
          )}

          {showAdvancedFilters && (
            <div className="advanced-filters" id="matrix-filters">
              <div className="filters-grid">
                <FilterSelect label="Matrix mode" value={filters.matrixMode} onChange={v => filters.setFilter('mode', v)}
                  options={[['symmetric', 'Symmetric'], ['v2c', 'Vowel → Consonant'], ['c2v', 'Consonant → Vowel']]} />
                <div className="filter-group">
                  <label htmlFor="filter-language">Language</label>
                  <input
                    id="filter-language"
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
              {showConsonantFilters && (
                <>
                  <h3 className="filters-subhead">Consonants</h3>
                  <div className="filters-grid">
                    <FilterSelect label="Manner" value={filters.mannerFilter} onChange={v => filters.setFilter('manner', v)}
                      options={withAll(options.mannerOptions, filters.mannerFilter)} />
                    <FilterSelect label="Place" value={filters.placeFilter} onChange={v => filters.setFilter('place', v)}
                      options={withAll(options.placeOptions, filters.placeFilter)} />
                    <FilterSelect label="Voicing" value={filters.voicedFilter} onChange={v => filters.setFilter('voiced', v)}
                      options={[['all', 'All'], ['true', 'Voiced'], ['false', 'Voiceless']]} />
                  </div>
                </>
              )}
              {showVowelFilters && (
                <>
                  <h3 className="filters-subhead">Vowels</h3>
                  <div className="filters-grid">
                    <FilterSelect label="Height" value={filters.heightFilter} onChange={v => filters.setFilter('height', v)}
                      options={withAll(sortHeights(options.heightOptions), filters.heightFilter)} />
                    <FilterSelect label="Backness" value={filters.backnessFilter} onChange={v => filters.setFilter('backness', v)}
                      options={withAll(sortBackness(options.backnessOptions), filters.backnessFilter)} />
                  </div>
                </>
              )}
              <div className="filters-footer">
                <span><strong>Tip:</strong> search for features like <code>[+nasal]</code>, <code>[+voiced]</code> or <code>[aspirated]</code> in the search bar.</span>
                <button type="button" className="control-btn" onClick={resetFeatureFilters} disabled={activeFeatureFilters === 0}>
                  <RotateCcw size={14} /> Reset filters
                </button>
              </div>
            </div>
          )}

          <MatrixLegend />

          {rowSymbols.length === 0 || colSymbols.length === 0 ? (
            <div className="matrix-empty" role="status">
              No sounds match these filters.{' '}
              <button type="button" className="link-btn" onClick={resetFeatureFilters}>Reset filters</button>
            </div>
          ) : (
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
                        isDiagonal={rS.id === cS.id} details={shiftById.get(`${rS.id}_to_${cS.id}`)}
                        inverseDetails={shiftById.get(`${cS.id}_to_${rS.id}`)}
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
          )}
        </>
      )}

      {intro}
    </div>
  );
};

const HEIGHT_ORDER = ['Close', 'Near-close', 'Close-mid', 'Mid', 'Open-mid', 'Near-open', 'Open'];
const BACKNESS_ORDER = ['Front', 'Central', 'Back'];
const byOrder = (order: string[]) => (xs: string[]) =>
  [...xs].sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
const sortHeights = byOrder(HEIGHT_ORDER);
const sortBackness = byOrder(BACKNESS_ORDER);

/** 'All' plus the options, keeping the current value even if it dropped out of the list. */
const withAll = (opts: string[], current: string): [string, string][] => [
  ['all', 'All'],
  ...(current !== 'all' && !opts.includes(current) ? [current, ...opts] : opts).map(o => [o, o] as [string, string]),
];

const FilterSelect = ({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][];
}) => {
  const id = `filter-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="filter-group">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)} className="filter-select">
        {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
      </select>
    </div>
  );
};

const TAB_HINTS = {
  matrix: 'Grid of sounds: rows are the starting sound, columns the result. Click a filled cell to open that shift.',
  landmarks: 'The most widespread sound changes (commonality 5), attested in many unrelated language families.',
  stats: 'Coverage statistics: documented shifts, languages, sources.',
} as const;

const CONTROL_HINTS = {
  category: 'Choose which sounds form the rows and columns: vowels, consonants, or both.',
  filters: 'Narrow the matrix: matrix mode, a language (only shifts attested in it are shown), consonant manner, place and voicing, vowel height and backness.',
  sounds: 'Choose which less common sounds get rows and columns: rare types such as ejectives (kʼ), clicks (ǃ), implosives (ɓ) and retroflexes (ʈ), and classes such as palatalized (tʲ), aspirated (tʰ), nasal vowels (ã) and diphthongs (ai). The number shows how many groups are on.',
  compare: 'Pick two filled cells to open both shifts side by side.',
} as const;

export default Home;
