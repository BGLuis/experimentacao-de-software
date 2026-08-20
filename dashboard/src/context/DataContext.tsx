import { createContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import Papa from 'papaparse';
import type { RepoData } from '../types';

interface DataContextType {
  data: RepoData[];
  loading: boolean;
}

export const DataContext = createContext<DataContextType>({ data: [], loading: true });

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RepoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const csvUrl = 'https://raw.githubusercontent.com/BGLuis/experimentacao-de-software/main/data/repositorios_populares.csv';
    
    Papa.parse(csvUrl, {
      download: true,
      header: true,
      dynamicTyping: true,
      worker: true,
      complete: (results) => {
        const parsed = (results.data as RepoData[]).filter(d => d && d.repositorio);
        setData(parsed);
        setLoading(false);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        setLoading(false);
      }
    });
  }, []);

  const value = useMemo(() => ({ data, loading }), [data, loading]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
