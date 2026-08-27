import { useState, useEffect } from 'react';
import { useData } from './useData';

export function useQuery<T = any>(
  queryBuilder: (whereClause: string) => string
) {
  const { runQuery, buildWhereClause, loading, isDbReady, filters, datasetMode } = useData();
  const [data, setData] = useState<T[]>([]);
  const [queryLoading, setQueryLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    if (loading || !isDbReady) {
      return;
    }

    async function execute() {
      try {
        setQueryLoading(true);
        const where = buildWhereClause();
        const sql = queryBuilder(where);
        const result = await runQuery<T>(sql);
        if (active) {
          setData(result);
          setQueryLoading(false);
          setError(null);
        }
      } catch (err: any) {
        if (active) {
          console.error("Erro no useQuery:", err);
          setError(err);
          setData([]);
          setQueryLoading(false);
        }
      }
    }

    execute();

    return () => {
      active = false;
    };
  }, [loading, isDbReady, filters, datasetMode, buildWhereClause, runQuery]);

  return { data, loading: (loading || !isDbReady) ? true : queryLoading, error };
}

