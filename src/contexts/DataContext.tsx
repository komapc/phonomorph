import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { fetchDataIndex, fetchUnattested } from '../data/loader';
import type { DataIndex } from '../data/loader';

interface DataContextType {
  index: DataIndex | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  /** Ids of researched-but-unattested pairs; null until ensureUnattested() resolves. */
  unattested: Set<string> | null;
  ensureUnattested: () => void;
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

  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchDataIndex();
      setIndex(data);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load the EchoDrift atlas. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // The full index (~700 KB across shards) is only needed for enrichment on
    // detail pages. Defer it past first paint there so it doesn't compete with
    // the page's own small JSON for bandwidth (LCP). Matrix routes need it now.
    const isDetail = window.location.pathname.startsWith('/transform/');
    if (!isDetail) {
      loadData();
      return;
    }
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const start = () => (w.requestIdleCallback ? w.requestIdleCallback(loadData, { timeout: 3000 }) : setTimeout(loadData, 1500));
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => window.removeEventListener('load', start);
  }, []);

  return (
    <DataContext.Provider value={{ index, loading, error, retry: loadData, unattested, ensureUnattested }}>
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
