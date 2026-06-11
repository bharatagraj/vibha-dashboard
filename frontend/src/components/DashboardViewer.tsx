/// DashboardViewer.tsx — Display dashboard data with KPI cards, charts, and data table
/// Consumes the /api/v1/dashboards/:id/data endpoint
/// Day 11: Integrated with EChartsRenderer (ECharts + auto-detection)

import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, TrendingUp } from 'lucide-react';
import { EChartsRenderer } from './EChartsRenderer';

interface KpiMetadata {
  database_column: string;
  display_name: string | null;
  unit: string | null;
  aggregation: string;
  decimals: number;
  data_type: string | null;
}

interface DashboardSummary {
  row_count: number;
  execution_time_ms: number;
  columns: string[];
}

interface DashboardDataResponse {
  id: string;
  name: string;
  scope_name: string;
  data: Record<string, string | number | null>[];
  kpis: KpiMetadata[];
  summary: DashboardSummary;
}

interface DashboardViewerProps {
  dashboardId: string;
  apiBaseUrl?: string;
}

/// Custom hook to fetch dashboard data
function useDashboardData(dashboardId: string, apiBaseUrl: string = '/api/v1') {
  const [data, setData] = useState<DashboardDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${apiBaseUrl}/dashboards/${dashboardId}/data?limit=100`
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (dashboardId) {
      fetchData();
    }
  }, [dashboardId, apiBaseUrl]);

  return { data, loading, error };
}

/// Format a value according to KPI metadata
function formatKpiValue(
  value: string | number | null,
  kpi: KpiMetadata
): string {
  if (value === null || value === undefined) {
    return '—';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return String(value);
  }

  // Format based on data type or decimals
  let formatted: string;

  if (kpi.data_type === 'percent') {
    formatted = `${(num * 100).toFixed(kpi.decimals)}%`;
  } else if (kpi.data_type === 'currency') {
    formatted = `$${num.toFixed(kpi.decimals)}`;
  } else {
    formatted = num.toFixed(kpi.decimals);
  }

  // Add unit if present
  if (kpi.unit) {
    formatted = `${formatted} ${kpi.unit}`;
  }

  return formatted;
}

/// KPI Card — Display a single metric with custom name and unit
function KpiCard({ kpi, data }: { kpi: KpiMetadata; data: Record<string, string | number | null>[] }) {
  if (data.length === 0) {
    return null;
  }

  const value = data[0][kpi.database_column];
  const displayName = kpi.display_name || kpi.database_column;
  const formatted = formatKpiValue(value, kpi);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{displayName}</p>
          <p className="text-3xl font-bold mt-2 text-gray-900">{formatted}</p>
        </div>
        <TrendingUp className="w-8 h-8 text-blue-500 opacity-30" />
      </div>
      {kpi.aggregation !== 'none' && (
        <p className="text-xs text-gray-500 mt-3">
          Aggregation: <span className="font-mono">{kpi.aggregation}</span>
        </p>
      )}
    </div>
  );
}

/// Data Table — Display all rows with KPI columns
function DataTable({
  kpis,
  data,
  maxRows = 20,
}: {
  kpis: KpiMetadata[];
  data: Record<string, string | number | null>[];
  maxRows?: number;
}) {
  const displayRows = data.slice(0, maxRows);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {kpis.map((kpi) => (
                <th
                  key={kpi.database_column}
                  className="px-6 py-3 text-left font-semibold text-gray-900 whitespace-nowrap"
                >
                  <div>{kpi.display_name || kpi.database_column}</div>
                  {kpi.unit && (
                    <div className="text-xs font-normal text-gray-500 mt-1">
                      {kpi.unit}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayRows.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 transition-colors"
              >
                {kpis.map((kpi) => (
                  <td
                    key={kpi.database_column}
                    className="px-6 py-4 text-gray-900"
                  >
                    {formatKpiValue(row[kpi.database_column], kpi)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > maxRows && (
        <div className="px-6 py-3 bg-gray-50 text-xs text-gray-600 border-t border-gray-200">
          Showing {maxRows} of {data.length} rows
        </div>
      )}
    </div>
  );
}

/// Charts Section — EChartsRenderer handles auto-detection internally
function ChartsSection({
  data,
}: {
  data: Record<string, string | number | null>[];
}) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Charts & Visualizations</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart — auto-detects dimensions/measures */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <EChartsRenderer
            type="pie"
            data={data}
            title="Distribution"
            height={360}
          />
        </div>

        {/* Bar Chart — auto-detects dimensions/measures */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <EChartsRenderer
            type="bar"
            data={data}
            title="Comparison"
            height={360}
          />
        </div>
      </div>
    </div>
  );
}

/// Main DashboardViewer Component
export function DashboardViewer({
  dashboardId,
  apiBaseUrl = '/api/v1',
}: DashboardViewerProps) {
  const { data, loading, error } = useDashboardData(dashboardId, apiBaseUrl);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Failed to load dashboard</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{data.name}</h1>
        <p className="text-gray-600 mt-1">{data.scope_name}</p>
        <div className="flex gap-4 mt-3 text-sm text-gray-500">
          <span>{data.summary.row_count} rows</span>
          <span>•</span>
          <span>{data.summary.execution_time_ms}ms</span>
        </div>
      </div>

      {/* KPI Cards */}
      {data.kpis.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.kpis.map((kpi) => (
              <KpiCard
                key={kpi.database_column}
                kpi={kpi}
                data={data.data}
              />
            ))}
          </div>
        </div>
      )}

      {/* Charts Section — Day 11, Hour 2 */}
      <ChartsSection data={data.data} />

      {/* Data Table */}
      {data.data.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Raw Data</h2>
          <DataTable kpis={data.kpis} data={data.data} maxRows={20} />
        </div>
      )}

      {/* Empty State */}
      {data.data.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No data available for this dashboard</p>
        </div>
      )}
    </div>
  );
}

export default DashboardViewer;
