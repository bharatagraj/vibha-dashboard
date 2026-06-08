import React, { Suspense, lazy } from 'react'
import { FilterSpec } from '@/types'

interface ChartRendererProps {
  spec: FilterSpec
  data: Record<string, unknown>[]
  loading?: boolean
  error?: string | null
}

// Lazy load D3-based charts (only when needed)
const BarChart = lazy(() => import('./charts/BarChart').then(m => ({ default: m.BarChart })))
const LineChart = lazy(() => import('./charts/LineChart').then(m => ({ default: m.LineChart })))
const PieChart = lazy(() => import('./charts/PieChart').then(m => ({ default: m.PieChart })))

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  spec,
  data,
  loading = false,
  error = null,
}) => {
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>⏳ Loading...</div>
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>
  if (!data || data.length === 0) return <div>No data</div>

  let ChartComponent: React.LazyExoticComponent<React.FC<any>> | null = null

  switch (spec.chartType) {
    case 'bar': ChartComponent = BarChart; break
    case 'line': ChartComponent = LineChart; break
    case 'pie': ChartComponent = PieChart; break
    default: return <div>Chart type {spec.chartType} not implemented</div>
  }

  return (
    <Suspense fallback={<div style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>📊 Rendering chart...</div>}>
      <ChartComponent spec={spec} data={data} />
    </Suspense>
  )
}
