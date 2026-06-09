/**
 * Schema Type Definitions
 * Matches backend schema_registry.rs structures
 */

export interface ColumnMetadata {
  name: string;
  type: string; // 'string', 'float', 'integer', 'date', etc.
  nullable: boolean;
  indexed: boolean;
}

export interface SchemaResponse {
  table: string;
  domain: string;
  columns: ColumnMetadata[];
}

export interface SchemaError {
  error: string;
}

/**
 * Dashboard Builder Types
 */
export interface KPIConfig {
  column: string;
  format: 'number' | 'currency' | 'percent' | 'date';
  label?: string;
}

export interface FilterConfig {
  column: string;
  type: 'equals' | 'range' | 'contains' | 'date_range';
  label?: string;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area' | 'table';
  title: string;
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
}

export interface DashboardConfig {
  id: string;
  name: string;
  domain: string;
  table: string;
  kpis: KPIConfig[];
  filters: FilterConfig[];
  charts: ChartConfig[];
  createdAt: string;
  updatedAt: string;
}
