import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchDataIndex, fetchUnattested } from '../data/loader';
import type { DataIndex } from '../data/loader';
import { usePagePayload } from './PagePayloadContext';
import type { PagePayload } from '../data/transformPayload';

// Routes whose pages never read the index (they load their own data or none).
const NO_INDEX_ROUTES = /^\/(?:about|glossary|laws|sources|compare\/[^/]+\/[^/]+)\/?$/;

/**
 * Whether the page someone lands on needs the full index (~50 KB gzipped
 * across shards) to render. Pages prerendered with their own data (transform,
 * hub, directory, families, static) and pages that don't use it get it later,
 * at idle, so it doesn't compete with first paint. The matrix home always
 * needs it: its prerendered HTML is only a skeleton.
 */
function landingNeedsIndex(pathname: string, payload: PagePayload | null): boolean {
  if (pathname.startsWith('/transform/')) return false;
  if (NO_INDEX_ROUTES.test(pathname)) return false;
  return !payload || payload.kind === 'home';
}

interface DataContextType {
  index: DataIndex | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  /** Ids of researched-but-unattested pairs; null until ensureUnattested() resolves. */
  unattested: Set<string> | null;
  ensureUnattested: () => void;
  /** Start loading the index now if it was deferred (e.g. the search box got focus). */
  ensureIndex: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState<DataIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unattested, setUnattested] = useState<Set<string> | null>(null);

  const ensureUnattested = useCallback(() => {
    fetchUnattested()
      .then(ids => setUnattested(new Set(ids)))
      .catch(err => console.warn('Failed to load unattested pairs:', err));
  }, []);

  // Initial state is already loading/no-error, so mount only needs the fetch;
  // retry resets first. Keeping them separate means the effect never calls setState synchronously.
  const fetchInto = () =>
    fetchDataIndex()
      .then(setIndex)
      .catch(err => {
        console.error('Failed to load data:', err);
        setError('Failed to load the EchoDrift atlas. Please check your connection and try again.');
      })
      .finally(() => setLoading(false));

  const retry = () => {
    setError(null);
    setLoading(true);
    fetchInto();
  };

  // The index is fetched at most once (retry aside), either right away or
  // deferred; whichever trigger comes first wins.
  const started = useRef(false);
  const ensureIndex = useCallback(() => {
    if (started.current) return;
    started.current = true;
    fetchInto();
  }, []);

  const { pathname } = useLocation();
  const payload = usePagePayload();
  const landingPath = useRef(pathname);

  useEffect(() => {
    if (landingNeedsIndex(landingPath.current, payload)) {
      ensureIndex();
      return;
    }
    // Defer past the load event and first paint so it doesn't compete with
    // the page's own resources for bandwidth (LCP).
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const start = () => (w.requestIdleCallback ? w.requestIdleCallback(ensureIndex, { timeout: 3000 }) : setTimeout(ensureIndex, 1500));
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => window.removeEventListener('load', start);
    // Landing-page decision only; later navigations are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Any client-side navigation may lead to a page that needs the index (the
  // embedded payload only describes the landing page), so stop deferring.
  useEffect(() => {
    if (pathname !== landingPath.current) ensureIndex();
  }, [pathname, ensureIndex]);

  return (
    <DataContext.Provider value={{ index, loading, error, retry, unattested, ensureUnattested, ensureIndex }}>
      {children}
    </DataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used inside DataProvider');
  }
  return context;
}
