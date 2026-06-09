/**
 * useSchemaFetch Hook
 * React hook for fetching and caching table schemas
 */

import { useState, useEffect, useCallback } from 'react';
import { SchemaResponse } from '../types/schema';
import { fetchSchema } from '../services/schemaApi';

interface UseSchemaFetchState {
  data: SchemaResponse | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch schema for a table
 * Automatically refetches when domain or table changes
 */
export function useSchemaFetch(
  domain: string | null,
  table: string | null
): UseSchemaFetchState {
  const [state, setState] = useState<UseSchemaFetchState>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!domain || !table) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState({ data: null, loading: true, error: null });

    try {
      const schema = await fetchSchema(domain, table);
      setState({ data: schema, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Unknown error'),
      });
    }
  }, [domain, table]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return state;
}

/**
 * Hook to fetch multiple schemas
 */
export function useSchemaBatch(
  schemas: Array<{ domain: string; table: string }>
) {
  const [data, setData] = useState<Record<string, SchemaResponse>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        const results: Record<string, SchemaResponse> = {};

        for (const schema of schemas) {
          const key = `${schema.domain}.${schema.table}`;
          const response = await fetchSchema(schema.domain, schema.table);
          results[key] = response;
        }

        setData(results);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    if (schemas.length > 0) {
      fetchAll();
    }
  }, [schemas]);

  return { data, loading, error };
}
