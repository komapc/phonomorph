import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { fetchDataIndex } from '../data/loader';
import type { DataIndex } from '../data/loader';

interface DataContextType {
  index: DataIndex | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState<DataIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchDataIndex();
      setIndex(data);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load the PhonoMorph atlas. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <DataContext.Provider value={{ index, loading, error, retry: loadData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used inside DataProvider');
  }
  return context;
}
