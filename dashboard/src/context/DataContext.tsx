import { createContext, useState, useEffect, useMemo, type ReactNode } from 'react';

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
    let active = true;

    async function loadData() {
      try {
        const duckdb = await import('@duckdb/duckdb-wasm');
        const duckdb_wasm = (await import('@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url')).default;
        const mvp_worker = (await import('@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url')).default;
        const duckdb_wasm_eh = (await import('@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url')).default;
        const eh_worker = (await import('@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url')).default;

        const MANUAL_BUNDLES = {
            mvp: {
                mainModule: duckdb_wasm,
                mainWorker: mvp_worker,
            },
            eh: {
                mainModule: duckdb_wasm_eh,
                mainWorker: eh_worker,
            },
        };

        const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
        
        const worker = new Worker(bundle.mainWorker!);
        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        const conn = await db.connect();

        // If the parquet file is not yet on GitHub, this will fail. We use a fallback to the CSV if needed,
        // but since the goal is migrating to Parquet, we'll try Parquet first.
        // For development, you can place 'repositorios_populares.parquet' in the public folder.
        const parquetUrl = 'https://raw.githubusercontent.com/BGLuis/experimentacao-de-software/main/data/repositorios_populares.parquet';
        
        await conn.query(`
          CREATE TABLE repos AS 
          SELECT * FROM read_parquet('${parquetUrl}')
        `);

        const result = await conn.query(`SELECT * FROM repos`);
        
        if (!active) return;

        const parsed = result.toArray().map((d: any) => {
          const row = d.toJSON();
          const getIsoString = (val: any) => val instanceof Date ? val.toISOString() : String(val || '');
          return {
            ...row,
            esta_arquivado: String(row.esta_arquivado).toLowerCase() === 'true',
            possui_wiki: String(row.possui_wiki).toLowerCase() === 'true',
            recebe_doacoes: String(row.recebe_doacoes).toLowerCase() === 'true',
            possui_issues: String(row.possui_issues).toLowerCase() === 'true',
            e_fork: String(row.e_fork).toLowerCase() === 'true',
            criado_em: getIsoString(row.criado_em),
            atualizado_em: getIsoString(row.atualizado_em)
          };
        });

        setData(parsed);
        setLoading(false);
      } catch (error) {
        console.error("Error loading via DuckDB Parquet:", error);
        if (!active) return;
        setLoading(false);
      }
    }

    loadData();

    return () => { active = false; };
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
