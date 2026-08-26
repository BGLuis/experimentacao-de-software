import { createContext, useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from 'react';
import type { RepoData, FilterState, MetadataInfo, DownloadProgress, DatasetMode, BackgroundProgress } from '../types';

export interface DataContextType {
  data: RepoData[];
  filteredData: RepoData[];
  loading: boolean;
  downloadProgress: DownloadProgress;
  backgroundProgress: BackgroundProgress;
  datasetMode: DatasetMode;
  setDatasetMode: (mode: DatasetMode) => Promise<void>;
  fullDataReady: boolean;
  isCached: boolean;
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
  backgroundProgress: {
    loadedBytes: 0,
    totalBytes: 0,
    percentage: 0,
    isDownloading: false,
    message: ''
  },
  datasetMode: '1000',
  setDatasetMode: async () => {},
  fullDataReady: false,
  isCached: false,
  metadata: null,
  filters: { languages: [], yearStart: '', yearEnd: '', repoType: 'all' },
  setFilters: () => {},
  runQuery: async () => [],
  buildWhereClause: () => ''
});

const PARQUET_CACHE_NAME = 'dashboard-parquet-cache-v2';
const PARQUET_CACHE_KEY = 'repositorios_populares.parquet';
// Incrementar a versão quando a amostra for regenerada, evitando que o
// navegador reutilize uma cópia antiga com menos registros.
const CSV_CACHE_NAME = 'dashboard-csv-cache-v2';
const CSV_CACHE_KEY = 'repositorios_populares_1000-v2.csv';

const PARQUET_URLS = [
  './data/repositorios_populares.parquet',
  'data/repositorios_populares.parquet',
  'https://raw.githubusercontent.com/BGLuis/experimentacao-de-software/main/data/repositorios_populares.parquet'
];

const CSV_URLS = [
  './data/repositorios_populares_1000.csv',
  'data/repositorios_populares_1000.csv',
  'https://raw.githubusercontent.com/BGLuis/experimentacao-de-software/main/data/repositorios_populares_1000.csv'
];

async function checkParquetInCache(): Promise<Uint8Array | null> {
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cache = await caches.open(PARQUET_CACHE_NAME);
      const cached = await cache.match(PARQUET_CACHE_KEY);
      if (cached) {
        const buffer = await cached.arrayBuffer();
        return new Uint8Array(buffer);
      }
    }
  } catch (err) {
    console.warn("Verificação de cache Parquet falhou:", err);
  }
  return null;
}

async function saveToCache(cacheName: string, cacheKey: string, buffer: Uint8Array, contentType: string) {
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cache = await caches.open(cacheName);
      await cache.put(
        cacheKey,
        new Response(buffer as any, {
          headers: { 'Content-Type': contentType }
        })
      );
    }
  } catch (err) {
    console.warn("Erro ao salvar no Cache API:", err);
  }
}

async function fetchBufferWithProgress(
  urls: string[],
  cacheName: string,
  cacheKey: string,
  contentType: string,
  onProgress?: (loaded: number, total: number, message: string) => void
): Promise<Uint8Array> {
  // 1. Try cache
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cache = await caches.open(cacheName);
      const cached = await cache.match(cacheKey);
      if (cached) {
        onProgress?.(0, 0, "Lendo dados do cache local...");
        const buffer = await cached.arrayBuffer();
        onProgress?.(buffer.byteLength, buffer.byteLength, "Dados carregados do cache!");
        return new Uint8Array(buffer);
      }
    }
  } catch (err) {
    console.warn("Cache API check failed:", err);
  }

  // 2. Fetch from URL candidates
  for (const url of urls) {
    try {
      onProgress?.(0, 0, "Conectando à fonte de dados...");
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Fetch de ${url} retornou HTTP ${response.status}`);
        continue;
      }

      const contentLengthHeader = response.headers.get('Content-Length');
      const total = contentLengthHeader 
        ? parseInt(contentLengthHeader, 10) 
        : (contentType === 'text/csv' ? 500 * 1024 : 25 * 1024 * 1024);

      const reader = response.body?.getReader();
      if (!reader) {
        const buffer = await response.arrayBuffer();
        onProgress?.(buffer.byteLength, buffer.byteLength, "Download concluído!");
        const u8 = new Uint8Array(buffer);
        saveToCache(cacheName, cacheKey, u8, contentType);
        return u8;
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
          onProgress?.(loaded, total, `Baixando dataset (${loadedMb} MB / ${totalMb} MB)...`);
        }
      }

      const combinedBuffer = new Uint8Array(loaded);
      let offset = 0;
      for (const chunk of chunks) {
        combinedBuffer.set(chunk, offset);
        offset += chunk.length;
      }

      saveToCache(cacheName, cacheKey, combinedBuffer, contentType);
      return combinedBuffer;
    } catch (e) {
      console.warn(`Erro ao baixar de ${url}:`, e);
    }
  }

  throw new Error(`Não foi possível baixar os dados de ${cacheKey}`);
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<MetadataInfo | null>(null);
  const [datasetMode, setDatasetModeState] = useState<DatasetMode>('1000');
  const [fullDataReady, setFullDataReady] = useState(false);
  const [isCached, setIsCached] = useState(false);

  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    loadedBytes: 0,
    totalBytes: 0,
    percentage: 0,
    status: 'fetching_meta',
    message: 'Obtendo metadados...'
  });

  const [backgroundProgress, setBackgroundProgress] = useState<BackgroundProgress>({
    loadedBytes: 0,
    totalBytes: 0,
    percentage: 0,
    isDownloading: false,
    message: ''
  });

  const [filters, setFilters] = useState<FilterState>({ 
    languages: [], 
    yearStart: '', 
    yearEnd: '', 
    repoType: 'all' 
  });

  const dbRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const targetModeRef = useRef<DatasetMode | null>(null);

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

  // 2. Initialize DuckDB-WASM and load dataset (cached Parquet vs fast initial 1000 + background Parquet)
  useEffect(() => {
    let active = true;

    async function initDuckDb() {
      try {
        setDownloadProgress(prev => ({
          ...prev,
          status: 'fetching_meta',
          message: 'Verificando cache local e inicializando motor SQL...'
        }));

        // 1. Check if full Parquet is already cached
        const cachedParquet = await checkParquetInCache();

        // 2. Initialize DuckDB WASM
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

        if (!active) return;
        dbRef.current = db;
        connRef.current = conn;

        if (cachedParquet) {
          // --- SCENARIO A: User already has full Parquet saved in cache -> Direct Full Mode (< 50ms) ---
          setIsCached(true);
          setDownloadProgress({
            loadedBytes: cachedParquet.byteLength,
            totalBytes: cachedParquet.byteLength,
            percentage: 100,
            status: 'initializing_duckdb',
            message: 'Carregando dataset completo do cache local...'
          });

          await db.registerFileBuffer('repos.parquet', cachedParquet);
          await conn.query(`
            CREATE TABLE repos_full AS 
            SELECT * FROM read_parquet('repos.parquet')
          `);
          await conn.query(`
            CREATE TABLE repos_1000 AS 
            SELECT * FROM repos_full LIMIT 1000
          `);
          await conn.query(`
            CREATE OR REPLACE VIEW repos AS 
            SELECT * FROM repos_full
          `);

          if (!active) return;
          setFullDataReady(true);
          setDatasetModeState('full');
          setDownloadProgress({
            loadedBytes: cachedParquet.byteLength,
            totalBytes: cachedParquet.byteLength,
            percentage: 100,
            status: 'ready',
            message: 'Pronto!'
          });
          setLoading(false);
        } else {
          // --- SCENARIO B: First visit / uncached -> Load fast 1000 CSV instantly (< 100ms) + fetch Parquet in background ---
          setIsCached(false);
          setDownloadProgress({
            loadedBytes: 0,
            totalBytes: 500 * 1024,
            percentage: 10,
            status: 'downloading',
            message: 'Carregando amostra rápida (1.000 repositórios)...'
          });

          const csvBuffer = await fetchBufferWithProgress(
            CSV_URLS,
            CSV_CACHE_NAME,
            CSV_CACHE_KEY,
            'text/csv',
            (loaded, total, message) => {
              if (!active) return;
              const percentage = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
              setDownloadProgress({
                loadedBytes: loaded,
                totalBytes: total,
                percentage,
                status: 'downloading',
                message
              });
            }
          );

          if (!active) return;

          await db.registerFileBuffer('repos_1000.csv', csvBuffer);
          await conn.query(`
            CREATE TABLE repos_1000 AS 
            SELECT * FROM read_csv_auto('repos_1000.csv')
          `);
          await conn.query(`
            CREATE OR REPLACE VIEW repos AS 
            SELECT * FROM repos_1000
          `);

          if (!active) return;

          setDatasetModeState('1000');
          setDownloadProgress({
            loadedBytes: csvBuffer.byteLength,
            totalBytes: csvBuffer.byteLength,
            percentage: 100,
            status: 'ready',
            message: 'Pronto!'
          });
          setLoading(false);

          // Launch non-blocking background fetch for full 202k dataset
          setBackgroundProgress({
            loadedBytes: 0,
            totalBytes: 25 * 1024 * 1024,
            percentage: 0,
            isDownloading: true,
            message: 'Baixando dataset completo em segundo plano...'
          });

          fetchBufferWithProgress(
            PARQUET_URLS,
            PARQUET_CACHE_NAME,
            PARQUET_CACHE_KEY,
            'application/vnd.apache.parquet',
            (loaded, total, _message) => {
              if (!active) return;
              const pct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
              setBackgroundProgress({
                loadedBytes: loaded,
                totalBytes: total,
                percentage: pct,
                isDownloading: true,
                message: `Baixando dataset completo (202k repos): ${pct}%...`
              });
            }
          ).then(async (parquetBuffer) => {
            if (!active || !dbRef.current || !connRef.current) return;
            try {
              await dbRef.current.registerFileBuffer('repos.parquet', parquetBuffer);
              await connRef.current.query(`
                CREATE TABLE repos_full AS 
                SELECT * FROM read_parquet('repos.parquet')
              `);

              if (!active) return;
              setFullDataReady(true);
              setIsCached(true);
              setBackgroundProgress({
                loadedBytes: parquetBuffer.byteLength,
                totalBytes: parquetBuffer.byteLength,
                percentage: 100,
                isDownloading: false,
                message: 'Dataset completo carregado e pronto!'
              });

              // If user requested full mode while download was running, switch view now
              if (targetModeRef.current === 'full') {
                await connRef.current.query(`
                  CREATE OR REPLACE VIEW repos AS 
                  SELECT * FROM repos_full
                `);
                setDatasetModeState('full');
                targetModeRef.current = null;
              }
            } catch (err) {
              console.error("Erro ao registrar repos_full em segundo plano:", err);
            }
          }).catch(err => {
            console.warn("Falha no download em segundo plano do Parquet:", err);
            if (active) {
              setBackgroundProgress(prev => ({
                ...prev,
                isDownloading: false,
                message: 'Não foi possível baixar o dataset completo em segundo plano.'
              }));
            }
          });
        }
      } catch (error) {
        console.error("Erro ao inicializar DuckDB WASM:", error);
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

  // Switch between 1000 (Amostra Rápida) and full (Dataset Completo)
  const setDatasetMode = useCallback(async (mode: DatasetMode) => {
    if (mode === datasetMode) return;

    if (mode === 'full' && !fullDataReady) {
      targetModeRef.current = 'full';
      setDatasetModeState('full');
      return;
    }

    if (!connRef.current) return;

    try {
      if (mode === 'full') {
        await connRef.current.query(`CREATE OR REPLACE VIEW repos AS SELECT * FROM repos_full`);
      } else {
        await connRef.current.query(`CREATE OR REPLACE VIEW repos AS SELECT * FROM repos_1000`);
      }
      targetModeRef.current = null;
      setDatasetModeState(mode);
    } catch (err) {
      console.error(`Erro ao alternar modo para ${mode}:`, err);
    }
  }, [datasetMode, fullDataReady]);

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
      conditions.push(`substring(CAST(criado_em AS VARCHAR), 1, 4) >= '${filters.yearStart.replace(/'/g, "''")}'`);
    }
    if (filters.yearEnd) {
      conditions.push(`substring(CAST(criado_em AS VARCHAR), 1, 4) <= '${filters.yearEnd.replace(/'/g, "''")}'`);
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
    backgroundProgress,
    datasetMode,
    setDatasetMode,
    fullDataReady,
    isCached,
    metadata,
    filters, 
    setFilters,
    runQuery,
    buildWhereClause
  }), [
    loading, 
    downloadProgress, 
    backgroundProgress, 
    datasetMode, 
    setDatasetMode, 
    fullDataReady, 
    isCached, 
    metadata, 
    filters, 
    runQuery, 
    buildWhereClause
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

