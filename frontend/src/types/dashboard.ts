export interface DashboardConfig {
  id: string
  name: string
  description?: string
  table: string
  domain: string
  kpis: KPIConfig[]
  filters: FilterConfig[]
  charts: ChartConfig[]
}

export interface KPIConfig {
  id: string
  label: string
  metric: string
  format?: 'number' | 'currency' | 'percentage'
}

export interface FilterConfig {
  id: string
  column: string
  label: string
  type: 'select' | 'date' | 'number_range'
  defaultValue?: string | number
}

export interface ChartConfig {
  id: string
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'heatmap'
  title: string
  xAxis?: string
  yAxis?: string
  groupBy?: string
}

export interface SchemaColumn {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  nullable?: boolean
}

export interface TableSchema {
  table: string
  columns: SchemaColumn[]
}
