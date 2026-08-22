import { createContext, useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from 'react';
import type { RepoData, FilterState, MetadataInfo, DownloadProgress } from '../types';

export interface DataContextType {
  data: RepoData[];
  filteredData: RepoData[];
  loading: boolean;
  downloadProgress: DownloadProgress;
  metadata: MetadataInfo | null;
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  runQuery: <T = any>(sql: string) => Promise<T[]>;
  buildWhereClause: (extraConditions?: string[]) => string;
}

export const DataContext = createContext<DataContextType>({ 
  data: [], 
  filteredData: [],
  loading: true,
  downloadProgress: {
    loadedBytes: 0,
    totalBytes: 0,
    percentage: 0,
    status: 'fetching_meta',
    message: 'Iniciando carregamento...'
  },
  metadata: null,
  filters: { languages: [], yearStart: '', yearEnd: '', repoType: 'all' },
  setFilters: () => {},
  runQuery: async () => [],
  buildWhereClause: () => ''
});

async function fetchParquetWithCache(
  urls: string[], 
  onProgress: (loaded: number, total: number, message: string) => void
): Promise<Uint8Array> {
  const CACHE_NAME = 'dashboard-parquet-cache-v2';
  const CACHE_KEY = 'repositorios_populares.parquet';

  // 1. Try Cache API first for 0ms load time on reload
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(CACHE_KEY);
      if (cachedResponse) {
        onProgress(0, 0, "Lendo dados otimizados do cache local...");
        const buffer = await cachedResponse.arrayBuffer();
        onProgress(buffer.byteLength, buffer.byteLength, "Dados carregados do cache!");
        return new Uint8Array(buffer);
      }
    }
  } catch (err) {
    console.warn("Cache API check failed:", err);
  }

  // 2. Try fetching from URL candidates (local public folder first, then remote CDN)
  for (const url of urls) {
    try {
      onProgress(0, 0, `Conectando a fonte de dados...`);
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Fetch de ${url} retornou HTTP ${response.status}`);
        continue;
      }

      const contentLengthHeader = response.headers.get('Content-Length');
      const total = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 25 * 1024 * 1024;
      
      const reader = response.body?.getReader();
      if (!reader) {
        const buffer = await response.arrayBuffer();
        onProgress(buffer.byteLength, buffer.byteLength, "Download concluído!");
        return new Uint8Array(buffer);
      }

      const chunks: Uint8Array[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;
          const loadedMb = (loaded / (1024 * 1024)).toFixed(1);
          const totalMb = (total / (1024 * 1024)).toFixed(1);
          onProgress(loaded, total, `Baixando dataset (${loadedMb} MB / ${totalMb} MB)...`);
        }
      }

      const combinedBuffer = new Uint8Array(loaded);
      let offset = 0;
      for (const chunk of chunks) {
        combinedBuffer.set(chunk, offset);
        offset += chunk.length;
      }

      // Store in Cache API for instant subsequent visits
      try {
        if (typeof window !== 'undefined' && 'caches' in window) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(
            CACHE_KEY, 
            new Response(combinedBuffer.buffer, {
              headers: { 'Content-Type': 'application/vnd.apache.parquet' }
            })
          );
        }
      } catch (cacheErr) {
        console.warn("Falha ao salvar no cache local:", cacheErr);
      }

      return combinedBuffer;
    } catch (e) {
      console.warn(`Erro ao baixar de ${url}:`, e);
    }
  }

  throw new Error("Não foi possível carregar os dados de repositórios.");
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<MetadataInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    loadedBytes: 0,
    totalBytes: 0,
    percentage: 0,
    status: 'fetching_meta',
    message: 'Obtendo metadados...'
  });
  const [filters, setFilters] = useState<FilterState>({ 
    languages: [], 
    yearStart: '', 
    yearEnd: '', 
    repoType: 'all' 
  });

  const connRef = useRef<any>(null);

  // 1. Fetch metadata.json immediately for instant UI initialization (< 20ms)
  useEffect(() => {
    async function loadMetadata() {
      const metaUrls = [
        './data/metadata.json',
        'data/metadata.json',
        'https://raw.githubusercontent.com/BGLuis/experimentacao-de-software/main/data/metadata.json'
      ];

      for (const url of metaUrls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data: MetadataInfo = await res.json();
            setMetadata(data);
            break;
          }
        } catch {
          // Ignore and try next URL
        }
      }
    }
    loadMetadata();
  }, []);

  // 2. Initialize DuckDB-WASM and load Parquet into table
  useEffect(() => {
    let active = true;

    async function initDuckDb() {
      try {
        setDownloadProgress(prev => ({
          ...prev,
          status: 'downloading',
          message: 'Iniciando download dos dados...'
        }));

        const parquetUrls = [
          './data/repositorios_populares.parquet',
          'data/repositorios_populares.parquet',
          'https://raw.githubusercontent.com/BGLuis/experimentacao-de-software/main/data/repositorios_populares.parquet'
        ];

        const parquetBuffer = await fetchParquetWithCache(parquetUrls, (loaded, total, message) => {
          if (!active) return;
          const percentage = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
          setDownloadProgress({
            loadedBytes: loaded,
            totalBytes: total,
            percentage,
            status: 'downloading',
            message
          });
        });

        if (!active) return;

        setDownloadProgress({
          loadedBytes: parquetBuffer.byteLength,
          totalBytes: parquetBuffer.byteLength,
          percentage: 100,
          status: 'initializing_duckdb',
          message: 'Inicializando motor DuckDB WASM...'
        });

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

        // Register the in-memory parquet buffer
        await db.registerFileBuffer('repos.parquet', parquetBuffer);

        // Create table
        await conn.query(`
          CREATE TABLE repos AS 
          SELECT * FROM read_parquet('repos.parquet')
        `);

        if (!active) return;

        connRef.current = conn;
        setDownloadProgress({
          loadedBytes: parquetBuffer.byteLength,
          totalBytes: parquetBuffer.byteLength,
          percentage: 100,
          status: 'ready',
          message: 'Pronto!'
        });
        setLoading(false);
      } catch (error) {
        console.error("Erro ao inicializar DuckDB WASM com Parquet:", error);
        if (!active) return;
        setDownloadProgress({
          loadedBytes: 0,
          totalBytes: 0,
          percentage: 0,
          status: 'error',
          message: 'Erro ao carregar os dados. Tente recarregar a página.'
        });
        setLoading(false);
      }
    }

    initDuckDb();

    return () => { 
      active = false; 
      if (connRef.current) {
        connRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Helper to run parameterized SQL queries safely and return typed rows
  const runQuery = useCallback(async <T = any>(sql: string): Promise<T[]> => {
    if (!connRef.current) return [];
    try {
      const result = await connRef.current.query(sql);
      const rows: T[] = result.toArray().map((d: any) => {
        const row = d.toJSON();
        for (const key in row) {
          if (typeof row[key] === 'bigint') {
            row[key] = Number(row[key]);
          }
        }
        return row;
      });
      return rows;
    } catch (err) {
      console.error("Erro na execução da query SQL DuckDB:", sql, err);
      return [];
    }
  }, []);

  // Helper to build SQL WHERE clause based on current active filters
  const buildWhereClause = useCallback((extraConditions: string[] = []): string => {
    const conditions: string[] = [...extraConditions];

    // Language filter
    if (filters.languages && filters.languages.length > 0) {
      const langConds = filters.languages.map(
        lang => `list_contains(list_transform(string_split(coalesce(linguagens, ''), ','), x -> trim(x)), '${lang.replace(/'/g, "''")}')`
      );
      conditions.push(`(${langConds.join(' OR ')})`);
    }

    // Year range filter
    if (filters.yearStart) {
      conditions.push(`substring(coalesce(criado_em, ''), 1, 4) >= '${filters.yearStart.replace(/'/g, "''")}'`);
    }
    if (filters.yearEnd) {
      conditions.push(`substring(coalesce(criado_em, ''), 1, 4) <= '${filters.yearEnd.replace(/'/g, "''")}'`);
    }

    // Repository Type filter
    if (filters.repoType === 'code_only') {
      conditions.push(`NOT (linguagens = 'Markdown' OR linguagens IS NULL OR lower(coalesce(tags, '')) LIKE '%awesome%' OR lower(coalesce(tags, '')) LIKE '%documentation%' OR lower(coalesce(tags, '')) LIKE '%book%')`);
    } else if (filters.repoType === 'docs_only') {
      conditions.push(`(linguagens = 'Markdown' OR linguagens IS NULL OR lower(coalesce(tags, '')) LIKE '%awesome%' OR lower(coalesce(tags, '')) LIKE '%documentation%' OR lower(coalesce(tags, '')) LIKE '%book%')`);
    }

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  }, [filters]);

  const value = useMemo(() => ({ 
    data: [], 
    filteredData: [], 
    loading, 
    downloadProgress,
    metadata,
    filters, 
    setFilters,
    runQuery,
    buildWhereClause
  }), [loading, downloadProgress, metadata, filters, runQuery, buildWhereClause]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

