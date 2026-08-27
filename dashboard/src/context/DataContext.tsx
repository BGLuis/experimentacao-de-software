import { createContext, useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from 'react';
import type { RepoData, FilterState, MetadataInfo, DownloadProgress, DatasetMode, BackgroundProgress } from '../types';

export interface DataContextType {
  data: RepoData[];
  filteredData: RepoData[];
  loading: boolean;
  isDbReady: boolean;
  initError: string | null;
  retryInit: () => void;
  clearCacheAndReload: () => Promise<void>;
  downloadProgress: DownloadProgress;
  backgroundProgress: BackgroundProgress;
  retryBackgroundDownload: () => void;
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
  isDbReady: false,
  initError: null,
  retryInit: () => {},
  clearCacheAndReload: async () => {},
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
    hasError: false,
    message: ''
  },
  retryBackgroundDownload: () => {},
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

/** Validates Parquet header magic bytes ('PAR1') and minimum viable size */
function isParquetBufferValid(buf: Uint8Array | null | undefined): boolean {
  if (!buf || buf.byteLength < 1024 * 1024) return false;
  // Parquet files must begin with ASCII 'PAR1' (0x50, 0x41, 0x52, 0x31)
  return buf[0] === 0x50 && buf[1] === 0x41 && buf[2] === 0x52 && buf[3] === 0x31;
}

/** Validates CSV header and minimum viable size */
function isCsvBufferValid(buf: Uint8Array | null | undefined): boolean {
  if (!buf || buf.byteLength < 500) return false;
  const snippet = new TextDecoder().decode(buf.subarray(0, 150));
  return snippet.toLowerCase().includes('repositorio');
}

/** Safely evicts corrupted or invalid entries from browser Cache API */
async function evictFromCache(cacheName: string, cacheKey: string) {
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cache = await caches.open(cacheName);
      await cache.delete(cacheKey);
      console.warn(`[Cache API] Entrada corrompida expurgada do cache: ${cacheKey}`);
    }
  } catch (err) {
    console.warn(`[Cache API] Falha ao expurgar cache ${cacheKey}:`, err);
  }
}

async function checkParquetInCache(): Promise<Uint8Array | null> {
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cache = await caches.open(PARQUET_CACHE_NAME);
      const cached = await cache.match(PARQUET_CACHE_KEY);
      if (cached) {
        const buffer = await cached.arrayBuffer();
        const u8 = new Uint8Array(buffer);
        if (isParquetBufferValid(u8)) {
          return u8;
        } else {
          console.warn("[Cache API] Arquivo Parquet em cache está incompleto ou corrompido. Descartando...");
          await evictFromCache(PARQUET_CACHE_NAME, PARQUET_CACHE_KEY);
        }
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
  // 1. Try cache with validation
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cache = await caches.open(cacheName);
      const cached = await cache.match(cacheKey);
      if (cached) {
        onProgress?.(0, 0, "Lendo dados do cache local...");
        const buffer = await cached.arrayBuffer();
        const u8 = new Uint8Array(buffer);
        const isValid = contentType.includes('parquet') ? isParquetBufferValid(u8) : isCsvBufferValid(u8);
        if (isValid) {
          onProgress?.(buffer.byteLength, buffer.byteLength, "Dados carregados do cache!");
          return u8;
        } else {
          await evictFromCache(cacheName, cacheKey);
        }
      }
    }
  } catch (err) {
    console.warn("Cache API check failed:", err);
  }

  // 2. Fetch from URL candidates
  let lastError: any = null;
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
        const u8 = new Uint8Array(buffer);
        const isValid = contentType.includes('parquet') ? isParquetBufferValid(u8) : isCsvBufferValid(u8);
        if (isValid) {
          onProgress?.(buffer.byteLength, buffer.byteLength, "Download concluído!");
          saveToCache(cacheName, cacheKey, u8, contentType);
          return u8;
        }
        throw new Error(`Dados inválidos recebidos de ${url}`);
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

      const isValid = contentType.includes('parquet') ? isParquetBufferValid(combinedBuffer) : isCsvBufferValid(combinedBuffer);
      if (!isValid) {
        throw new Error(`O arquivo baixado de ${url} não passou na verificação de integridade.`);
      }

      saveToCache(cacheName, cacheKey, combinedBuffer, contentType);
      return combinedBuffer;
    } catch (e) {
      console.warn(`Erro ao baixar de ${url}:`, e);
      lastError = e;
    }
  }

  throw lastError || new Error(`Não foi possível baixar os dados de ${cacheKey}`);
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isDbReady, setIsDbReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [initCounter, setInitCounter] = useState(0);

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
    hasError: false,
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

  // Background download launcher for the full 202k dataset
  const startBackgroundParquetDownload = useCallback(() => {
    if (fullDataReady || !dbRef.current || !connRef.current) return;

    setBackgroundProgress({
      loadedBytes: 0,
      totalBytes: 25 * 1024 * 1024,
      percentage: 0,
      isDownloading: true,
      hasError: false,
      message: 'Baixando dataset completo em segundo plano...'
    });

    fetchBufferWithProgress(
      PARQUET_URLS,
      PARQUET_CACHE_NAME,
      PARQUET_CACHE_KEY,
      'application/vnd.apache.parquet',
      (loaded, total, _message) => {
        const pct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
        setBackgroundProgress({
          loadedBytes: loaded,
          totalBytes: total,
          percentage: pct,
          isDownloading: true,
          hasError: false,
          message: `Baixando dataset completo (202k repos): ${pct}%...`
        });
      }
    ).then(async (parquetBuffer) => {
      if (!isParquetBufferValid(parquetBuffer)) {
        throw new Error("Arquivo Parquet baixado não é válido.");
      }
      if (!dbRef.current || !connRef.current) return;

      try {
        await dbRef.current.registerFileBuffer('repos.parquet', parquetBuffer);
        await connRef.current.query(`
          CREATE TABLE repos_full AS 
          SELECT * FROM read_parquet('repos.parquet')
        `);

        setFullDataReady(true);
        setIsCached(true);
        setBackgroundProgress({
          loadedBytes: parquetBuffer.byteLength,
          totalBytes: parquetBuffer.byteLength,
          percentage: 100,
          isDownloading: false,
          hasError: false,
          message: 'Dataset completo carregado e pronto para uso!'
        });
      } catch (err: any) {
        console.error("Erro ao registrar repos_full em segundo plano:", err);
        setBackgroundProgress(prev => ({
          ...prev,
          isDownloading: false,
          hasError: true,
          message: 'Falha ao registrar dataset completo no DuckDB.'
        }));
      }
    }).catch(err => {
      console.warn("Falha no download em segundo plano do Parquet:", err);
      setBackgroundProgress(prev => ({
        ...prev,
        isDownloading: false,
        hasError: true,
        message: 'Não foi possível baixar o dataset completo em segundo plano.'
      }));
    });
  }, [fullDataReady]);

  // 2. Initialize DuckDB-WASM safely
  useEffect(() => {
    let active = true;

    async function initDuckDb() {
      setLoading(true);
      setIsDbReady(false);
      setInitError(null);

      try {
        setDownloadProgress(prev => ({
          ...prev,
          status: 'fetching_meta',
          message: 'Verificando cache local e inicializando motor SQL...'
        }));

        // 1. Check if full Parquet is already cached and valid
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
        
        // Listen for worker crashes or out of memory events
        worker.onerror = (e) => {
          console.error("DuckDB WASM Worker fatal error:", e);
          if (active) {
            setIsDbReady(false);
            setInitError("Ocorreu um erro no DuckDB WASM Worker (possível falta de memória do navegador).");
          }
        };

        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        const conn = await db.connect();

        if (!active) {
          await conn.close().catch(() => {});
          return;
        }

        let fullSuccess = false;

        if (cachedParquet) {
          // --- SCENARIO A: Try loading cached full dataset ---
          try {
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

            fullSuccess = true;
            if (!active) return;

            dbRef.current = db;
            connRef.current = conn;
            setIsCached(true);
            setFullDataReady(true);
            setDatasetModeState('full');
            setIsDbReady(true);
            setDownloadProgress({
              loadedBytes: cachedParquet.byteLength,
              totalBytes: cachedParquet.byteLength,
              percentage: 100,
              status: 'ready',
              message: 'Pronto!'
            });
            setLoading(false);
          } catch (cacheErr) {
            console.warn("[Cache API] Falha ao processar Parquet do cache. Expurgando e baixando amostra...", cacheErr);
            await evictFromCache(PARQUET_CACHE_NAME, PARQUET_CACHE_KEY);
            fullSuccess = false;
          }
        }

        // --- SCENARIO B: Fast initial 1000 CSV load ---
        if (!fullSuccess) {
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

          // Gate of readiness: ONLY enable connRef and isDbReady once the 'repos' view is strictly created
          dbRef.current = db;
          connRef.current = conn;
          setDatasetModeState('1000');
          setIsDbReady(true);
          setDownloadProgress({
            loadedBytes: csvBuffer.byteLength,
            totalBytes: csvBuffer.byteLength,
            percentage: 100,
            status: 'ready',
            message: 'Pronto!'
          });
          setLoading(false);

          // Trigger background download of 202k dataset
          startBackgroundParquetDownload();
        }
      } catch (error: any) {
        console.error("Erro fatal ao inicializar DuckDB WASM:", error);
        if (!active) return;
        connRef.current = null;
        setIsDbReady(false);
        setInitError(error?.message || 'Falha na conexão com a base de dados.');
        setDownloadProgress({
          loadedBytes: 0,
          totalBytes: 0,
          percentage: 0,
          status: 'error',
          message: 'Erro ao carregar os dados. Verifique sua conexão e tente novamente.'
        });
        setLoading(false);
      }
    }

    initDuckDb();

    return () => { 
      active = false; 
      if (connRef.current) {
        connRef.current.close().catch(() => {});
        connRef.current = null;
      }
      setIsDbReady(false);
    };
  }, [initCounter, startBackgroundParquetDownload]);

  // Retry initialization
  const retryInit = useCallback(() => {
    setInitCounter(prev => prev + 1);
  }, []);

  // Clear cache and reload
  const clearCacheAndReload = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        await caches.delete(PARQUET_CACHE_NAME);
        await caches.delete(CSV_CACHE_NAME);
      }
    } catch (e) {
      console.warn("Erro ao limpar caches:", e);
    }
    window.location.reload();
  }, []);

  // Switch between 1000 (Amostra Rápida) and full (Dataset Completo) safely
  const setDatasetMode = useCallback(async (mode: DatasetMode) => {
    if (mode === datasetMode) return;

    if (mode === 'full' && !fullDataReady) {
      console.warn("Tentativa de selecionar modo 'full' antes do dataset completo estar pronto.");
      return;
    }

    if (!connRef.current || !isDbReady) return;

    try {
      if (mode === 'full') {
        await connRef.current.query(`CREATE OR REPLACE VIEW repos AS SELECT * FROM repos_full`);
      } else {
        await connRef.current.query(`CREATE OR REPLACE VIEW repos AS SELECT * FROM repos_1000`);
      }
      setDatasetModeState(mode);
    } catch (err) {
      console.error(`Erro ao alternar modo para ${mode}:`, err);
    }
  }, [datasetMode, fullDataReady, isDbReady]);

  // Safe SQL query execution
  const runQuery = useCallback(async <T = any>(sql: string): Promise<T[]> => {
    if (!isDbReady || !connRef.current) {
      console.warn("runQuery chamado antes do DuckDB estar pronto:", sql);
      return [];
    }
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
      throw err;
    }
  }, [isDbReady]);

  // Helper to build SQL WHERE clause based on active filters
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
    isDbReady,
    initError,
    retryInit,
    clearCacheAndReload,
    downloadProgress,
    backgroundProgress,
    retryBackgroundDownload: startBackgroundParquetDownload,
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
    isDbReady,
    initError,
    retryInit,
    clearCacheAndReload,
    downloadProgress, 
    backgroundProgress, 
    startBackgroundParquetDownload,
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

