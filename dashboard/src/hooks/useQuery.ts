import { useState, useEffect } from 'react';
import { useData } from './useData';

export function useQuery<T = any>(
  queryBuilder: (whereClause: string) => string
) {
  const { runQuery, buildWhereClause, loading, filters } = useData();
  const [data, setData] = useState<T[]>([]);
  const [queryLoading, setQueryLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    if (loading) {
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
          setError(err);
          setQueryLoading(false);
        }
      }
    }

    execute();

    return () => {
      active = false;
    };
  }, [loading, filters, buildWhereClause, runQuery, ]); // Removed queryBuilder to prevent infinite loop

  return { data, loading: loading || queryLoading, error };
}

