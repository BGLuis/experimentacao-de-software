import { createContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import Papa from 'papaparse';
import type { RepoData } from '../types';

export interface FilterState {
  language: string;
  year: string;
}

interface DataContextType {
  data: RepoData[];
  filteredData: RepoData[];
  loading: boolean;
  filters: FilterState;
  setFilters: (f: FilterState) => void;
}

export const DataContext = createContext<DataContextType>({ 
  data: [], 
  filteredData: [],
  loading: true,
  filters: { language: '', year: '' },
  setFilters: () => {}
});

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RepoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ language: '', year: '' });

  useEffect(() => {
    const csvUrl = 'https://raw.githubusercontent.com/BGLuis/experimentacao-de-software/main/data/repositorios_populares.csv';
    
    Papa.parse(csvUrl, {
      download: true,
      header: true,
      dynamicTyping: true,
      worker: true,
      complete: (results) => {
        const parsed = (results.data as RepoData[])
          .filter(d => d && d.repositorio)
          .map(d => {
            const getIsoString = (val: any) => val instanceof Date ? val.toISOString() : String(val || '');
            return {
              ...d,
              esta_arquivado: String(d.esta_arquivado).toLowerCase() === 'true',
              possui_wiki: String(d.possui_wiki).toLowerCase() === 'true',
              recebe_doacoes: String(d.recebe_doacoes).toLowerCase() === 'true',
              possui_issues: String(d.possui_issues).toLowerCase() === 'true',
              e_fork: String(d.e_fork).toLowerCase() === 'true',
              criado_em: getIsoString(d.criado_em),
              atualizado_em: getIsoString(d.atualizado_em)
            };
          });
        setData(parsed);
        setLoading(false);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        setLoading(false);
      }
    });
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      let matchesLang = true;
      let matchesYear = true;

      if (filters.language) {
        matchesLang = !!d.linguagens && d.linguagens.split(',').map(l => l.trim()).includes(filters.language);
      }
      
      if (filters.year) {
        matchesYear = !!d.criado_em && d.criado_em.startsWith(filters.year);
      }

      return matchesLang && matchesYear;
    });
  }, [data, filters]);

  const value = useMemo(() => ({ 
    data, 
    filteredData, 
    loading, 
    filters, 
    setFilters 
  }), [data, filteredData, loading, filters]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
