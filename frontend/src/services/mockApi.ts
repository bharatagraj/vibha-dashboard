import { FilterSpec, QueryMode } from '@/types'

// Mock data generator
export const generateMockFilterSpec = (query: string, mode: QueryMode): FilterSpec => {
  const mockData = {
    bar: {
      table: 'sales',
      domain: 'sales',
      columns: [
        { name: 'region', displayName: 'Region', dataType: 'string' },
        { name: 'revenue', displayName: 'Revenue', dataType: 'number' },
      ],
      filters: null,
      groupBy: ['region'],
      chartType: 'bar' as const,
      dimensions: {
        width: 800,
        height: 400,
        margin: { top: 20, right: 20, bottom: 20, left: 60 },
        xAxisKey: 'region',
        yAxisKey: 'revenue',
      },
      metadata: {
        queryMode: mode,
        executionTimeMs: mode === 'ai' ? 2847 : 127,
      },
    },
    line: {
      table: 'metrics',
      domain: 'operations',
      columns: [
        { name: 'date', displayName: 'Date', dataType: 'date' },
        { name: 'value', displayName: 'Value', dataType: 'number' },
      ],
      filters: null,
      groupBy: [],
      chartType: 'line' as const,
      dimensions: {
        width: 800,
        height: 400,
        margin: { top: 20, right: 20, bottom: 20, left: 60 },
        xAxisKey: 'date',
        yAxisKey: 'value',
      },
      metadata: {
        queryMode: mode,
        executionTimeMs: mode === 'ai' ? 3200 : 95,
      },
    },
    pie: {
      table: 'products',
      domain: 'inventory',
      columns: [
        { name: 'category', displayName: 'Category', dataType: 'string' },
        { name: 'count', displayName: 'Count', dataType: 'number' },
      ],
      filters: null,
      groupBy: ['category'],
      chartType: 'pie' as const,
      dimensions: {
        width: 600,
        height: 400,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
        xAxisKey: 'category',
        yAxisKey: 'count',
      },
      metadata: {
        queryMode: mode,
        executionTimeMs: mode === 'ai' ? 2100 : 110,
      },
    },
  }

  // Determine chart type from query
  let chartType: 'bar' | 'line' | 'pie' = 'bar'
  if (query.toLowerCase().includes('trend') || query.toLowerCase().includes('time')) {
    chartType = 'line'
  } else if (query.toLowerCase().includes('distribution') || query.toLowerCase().includes('breakdown')) {
    chartType = 'pie'
  }

  return mockData[chartType]
}

// Mock API call handler
export const mockApiCall = async (endpoint: string, data: any, mode: QueryMode): Promise<{ filterSpec: FilterSpec }> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, mode === 'ai' ? 2000 : 100))

  const query = data.query || data.table || 'Show data'
  const filterSpec = generateMockFilterSpec(query, mode)

  return {
    filterSpec,
  }
}

// Mock data for charts
export const getMockChartData = (chartType: string): Record<string, unknown>[] => {
  const dataMap: Record<string, Record<string, unknown>[]> = {
    bar: [
      { region: 'North', revenue: 45000 },
      { region: 'South', revenue: 52000 },
      { region: 'East', revenue: 38000 },
      { region: 'West', revenue: 61000 },
      { region: 'Central', revenue: 55000 },
    ],
    line: [
      { date: 'Jan', value: 100 },
      { date: 'Feb', value: 150 },
      { date: 'Mar', value: 120 },
      { date: 'Apr', value: 200 },
      { date: 'May', value: 180 },
      { date: 'Jun', value: 220 },
    ],
    area: [
      { date: 'Jan', value: 100 },
      { date: 'Feb', value: 150 },
      { date: 'Mar', value: 120 },
      { date: 'Apr', value: 200 },
      { date: 'May', value: 180 },
    ],
    scatter: [
      { x: 10, y: 20 },
      { x: 20, y: 30 },
      { x: 30, y: 25 },
      { x: 40, y: 50 },
      { x: 50, y: 45 },
    ],
    pie: [
      { category: 'Electronics', count: 35 },
      { category: 'Clothing', count: 25 },
      { category: 'Food', count: 20 },
      { category: 'Books', count: 15 },
      { category: 'Other', count: 5 },
    ],
    heatmap: [
      { x: 'A', y: '1', value: 10 },
      { x: 'A', y: '2', value: 20 },
      { x: 'B', y: '1', value: 30 },
      { x: 'B', y: '2', value: 25 },
      { x: 'C', y: '1', value: 15 },
    ],
  }

  return dataMap[chartType] || dataMap.bar
}
