import { useState, useEffect } from 'react';

export interface AnalyticsScope {
  id: string;
  scope_name: string;
  scope_type: string;
  description?: string;
  query_definition: any;
  mdm_enabled: boolean;
}

export function useScopes() {
  const [scopes, setScopes] = useState<AnalyticsScope[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScopes = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/scopes');
        if (response.ok) {
          const data = await response.json();
          setScopes(data.scopes);
          console.log('✅ Scopes loaded:', data.scopes.length);
        } else {
          throw new Error('Failed to fetch scopes');
        }
      } catch (err) {
        console.error('❌ Error fetching scopes:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchScopes();
  }, []);

  return { scopes, loading, error };
}
