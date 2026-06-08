export type ChartType = 'bar' | 'line' | 'area' | 'scatter' | 'pie' | 'heatmap'
export type QueryMode = 'ai' | 'quick'

export interface Column {
  name: string
  displayName?: string
  dataType?: string
}

export interface FilterSpec {
  table: string
  domain: string
  columns: Column[]
  filters: any
  groupBy: string[]
  chartType: ChartType
  dimensions: any
  metadata?: {
    queryMode: QueryMode
    executionTimeMs?: number
  }
}

export interface ParseRequest {
  query: string
  domain: string
}

export interface DirectQueryRequest {
  table: string
  columns: string[]
  groupBy?: string[]
  filters?: any
  domain: string
}
