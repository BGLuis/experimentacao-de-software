import { createContext, useState, useEffect, type ReactNode } from 'react';
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
    const csvPath = `${import.meta.env.BASE_URL || './'}repositorios_1000.csv`;
    Papa.parse(csvPath, {
      download: true,
      header: true,
      dynamicTyping: true,
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

  return (
    <DataContext.Provider value={{ data, loading }}>
      {children}
    </DataContext.Provider>
  );
}
