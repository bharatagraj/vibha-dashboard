import React, { useState, useEffect, useCallback } from 'react'
import { DashboardSelector } from './DashboardSelector'
import { DynamicFilters } from './DynamicFilters'
import { DynamicKPIs } from './DynamicKPIs'
import { ExportButtons } from './ExportButtons'
import { EChartsRenderer } from './EChartsRenderer'
import { DataTable } from './DataTable'
import { ChartEventsProvider, useChartEventListener } from '@/hooks/useChartEvents'
import { getDashboardConfig } from '@/data/dashboards'
import { getMockChartData } from '@/services/mockApi'
import { useDashboardData } from '@/hooks/useDashboardData'
import { logPerformance } from '@/services/performanceMonitor'

const DashboardContent: React.FC = () => {
  logPerformance('DashboardContent render start')

  const [selectedDashboardId, setSelectedDashboardId] = useState('co2_dashboard')
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { loading, error, data, kpiValues, fetchData } = useDashboardData()

  const dashboardConfig = getDashboardConfig(selectedDashboardId)

  const handleCategorySelect = useCallback((categoryName: string | undefined) => {
    if (categoryName) {
      setSelectedCategory(prev => prev === categoryName ? null : categoryName)
    }
  }, [])

  // Memoize the event handler callback
  const handleSelectCategoryEvent = useCallback((event: any) => {
    handleCategorySelect(event.payload.categoryName)
  }, [handleCategorySelect])

  // Hour 2: Listen for chart events (cross-chart filtering)
  useChartEventListener('SELECT_CATEGORY', handleSelectCategoryEvent)

  useEffect(() => {
    if (!dashboardConfig) return
    logPerformance('Fetching dashboard data...')
    fetchData({
      table: dashboardConfig.table,
      domain: dashboardConfig.domain,
      columns: dashboardConfig.kpis.map(k => k.metric),
      groupBy: dashboardConfig.charts[0]?.xAxis ? [dashboardConfig.charts[0].xAxis] : [],
      filters: Object.keys(filterValues).length > 0 ? filterValues : undefined,
    })
  }, [selectedDashboardId, filterValues, dashboardConfig, fetchData])

  const handleFilterChange = (filterId: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [filterId]: value }))
  }

  const handleClearFilter = () => {
    setSelectedCategory(null)
  }

  if (!dashboardConfig) return <div style={{ padding: '2rem' }}>Dashboard not found</div>

  const chartData = data.length > 0 ? data : getMockChartData(dashboardConfig.charts[0]?.type || 'bar')
  const xAxisColumn = dashboardConfig.charts[0]?.xAxis
  const filteredTableData = selectedCategory && xAxisColumn
    ? chartData.filter((row: Record<string, any>) => String(row[xAxisColumn]) === selectedCategory)
    : chartData

  let selectedCategoryPercentage = 0
  if (selectedCategory && xAxisColumn) {
    const yAxisColumn = dashboardConfig.charts[0]?.yAxis
    if (yAxisColumn) {
      const selectedValue = chartData
        .filter((row: Record<string, any>) => String(row[xAxisColumn]) === selectedCategory)
        .reduce((sum, row) => sum + (parseFloat(row[yAxisColumn]) || 0), 0)
      const totalValue = chartData.reduce((sum, row) => sum + (parseFloat(row[yAxisColumn]) || 0), 0)
      selectedCategoryPercentage = totalValue > 0 ? (selectedValue / totalValue * 100) : 0
    }
  }

  const kpiData = Object.keys(kpiValues).length > 0 ? kpiValues : {
    total_co2e: 1334.42,
    embedded_co2e: 743.6,
    usage_co2e: 590.82,
    total_revenue: 125000,
    order_count: 183,
    avg_order_value: 683.06,
  }

  logPerformance('DashboardContent render complete')

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>📊 Vibha Dashboard</h1>
        <p style={{ color: '#666', margin: 0 }}>
          Dynamic dashboard system — Select a dashboard and refine with filters
          {selectedCategory && ` • Filter Active: ${selectedCategory}`}
        </p>
      </div>

      <DashboardSelector selectedId={selectedDashboardId} onSelect={setSelectedDashboardId} />
      <ExportButtons dashboardName={dashboardConfig.name} data={chartData} />
      <DynamicFilters filters={dashboardConfig.filters} values={filterValues} onChange={handleFilterChange} />

      {loading && (
        <div style={{ padding: '1rem', backgroundColor: '#e3f2fd', borderRadius: '4px', marginBottom: '1rem', color: '#1976d2' }}>
          ⏳ Loading data... {error && `(${error})`}
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '4px', marginBottom: '1rem', color: '#856404' }}>
          ⚠️ {error}
        </div>
      )}

      {Object.keys(filterValues).length > 0 && !loading && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#e8f4f8', border: '1px solid #0066cc', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem', color: '#0066cc' }}>
          ✅ Filters applied: {JSON.stringify(filterValues)}
        </div>
      )}

      <DynamicKPIs kpis={dashboardConfig.kpis} data={kpiData} />

      {selectedCategory && !loading && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#ecfdf5', 
          border: '2px solid #10b981', 
          borderRadius: '6px', 
          marginBottom: '1.5rem', 
          fontSize: '0.95rem', 
          color: '#047857',
          fontWeight: 500 
        }}>
          📌 Category Filter Active: <strong>{selectedCategory}</strong> ({selectedCategoryPercentage.toFixed(1)}% of total)
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Charts & Visualizations</h3>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
          💡 Hour 2: Click on any chart element to filter all charts & data table
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem' }}>
          {dashboardConfig.charts.map((chartConfig) => (
            <div key={chartConfig.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem', backgroundColor: 'white' }}>
              <h4 style={{ marginTop: 0 }}>{chartConfig.title}</h4>
              {loading && <div style={{ textAlign: 'center', color: '#999' }}>Loading chart...</div>}
              {!loading && (
                <EChartsRenderer
                  type={chartConfig.type as any}
                  data={chartData}
                  title={chartConfig.title}
                  height={300}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <DataTable 
        data={filteredTableData} 
        filteredBy={selectedCategory}
        onClearFilter={handleClearFilter}
      />
    </div>
  )
}

export const DashboardHome: React.FC = () => {
  return (
    <ChartEventsProvider>
      <DashboardContent />
    </ChartEventsProvider>
  )
}

export default DashboardHome
