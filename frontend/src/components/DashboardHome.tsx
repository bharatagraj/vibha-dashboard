import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { DashboardSelector } from './DashboardSelector'
import { DynamicFilters } from './DynamicFilters'
import { DynamicKPIs } from './DynamicKPIs'
import { ExportButtons } from './ExportButtons'
import { EChartsRenderer, EChartsRendererHandle } from './EChartsRenderer'
import { DataTable } from './DataTable'
import { Card } from './Card'
import { LayoutEngine, LayoutItem } from './LayoutEngine'
import { ChartEventsProvider, useChartEventListener } from '@/hooks/useChartEvents'
import { getDashboardConfig } from '@/data/dashboards'
import { getMockChartData } from '@/services/mockApi'
import { useDashboardData } from '@/hooks/useDashboardData'
import { logPerformance } from '@/services/performanceMonitor'
import { exportChart, generateChartFilename, ChartExportFormat } from '@/services/chartExport'

const DashboardContent: React.FC = () => {
  logPerformance('DashboardContent render start')

  const [selectedDashboardId, setSelectedDashboardId] = useState('co2_dashboard')
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showChartExportMenu, setShowChartExportMenu] = useState<Record<string, boolean>>({})
  const { loading, error, data, kpiValues, fetchData } = useDashboardData()

  const chartRefsMap = useRef<Map<string, React.RefObject<EChartsRendererHandle>>>(new Map())

  const dashboardConfig = getDashboardConfig(selectedDashboardId)

  const handleCategorySelect = useCallback((categoryName: string | undefined) => {
    if (categoryName) {
      setSelectedCategory(prev => prev === categoryName ? null : categoryName)
    }
  }, [])

  const handleSelectCategoryEvent = useCallback((event: any) => {
    handleCategorySelect(event.payload.categoryName)
  }, [handleCategorySelect])

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

  // FIX: Retry mechanism for chart export (wait for chart instance to be ready)
  const handleChartExport = async (chartId: string, format: ChartExportFormat) => {
    const chartRef = chartRefsMap.current.get(chartId)
    let chartInstance = chartRef?.current?.chartInstance
    let retries = 0
    const maxRetries = 10

    // Retry every 100ms up to 1 second
    while (!chartInstance && retries < maxRetries) {
      console.log(`⏳ Waiting for chart ${chartId} to be ready... (attempt ${retries + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, 100))
      chartInstance = chartRef?.current?.chartInstance
      retries++
    }

    if (!chartInstance) {
      console.error(`❌ Export failed: Chart ${chartId} instance not ready after ${maxRetries} retries`)
      alert(`Export failed: Chart is not ready yet. Please try again in a moment.`)
      return
    }

    const chart = dashboardConfig?.charts.find(c => c.id === chartId)
    if (!chart) {
      console.error(`Chart config ${chartId} not found`)
      return
    }

    const filename = generateChartFilename(chart.title)
    console.log(`✅ Chart ${chartId} ready! Exporting as ${format.toUpperCase()}...`)
    exportChart(
      chartInstance,
      format,
      chartData,
      filename,
      chart.title,
    )

    setShowChartExportMenu(prev => ({ ...prev, [chartId]: false }))
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

  const chartsForExport = dashboardConfig.charts.map(chartConfig => ({
    title: chartConfig.title,
    data: chartData,
  }))

  logPerformance('DashboardContent render complete')

  const EXPORT_FORMATS: ChartExportFormat[] = ['png', 'jpg', 'svg', 'pdf', 'pptx', 'json']

  // =========================================================================
  // DAY 13: LAYOUT GENERATION — Match chart IDs to layout items
  // =========================================================================
  
  const chartLayoutConfig = useMemo(() => {
    if (!dashboardConfig?.charts) return []
    
    return dashboardConfig.charts.map((chart, idx) => {
      const colsPerRow = 2
      const row = Math.floor(idx / colsPerRow)
      const col = (idx % colsPerRow) * 6

      return {
        i: chart.id,        // CRITICAL: match the chart's key
        x: col,
        y: row * 4,
        w: 6,
        h: 4,
        minW: 3,
        minH: 2,
      } as LayoutItem
    })
  }, [dashboardConfig])

  // =========================================================================
  // THREE-ZONE LAYOUT (Day 13)
  // =========================================================================

  // ZONE 1 (Fixed): Filter & Dashboard Controls
  // ZONE 2 (Fixed): KPI Strip (CSS Grid)
  // ZONE 3 (Flexible): Chart Canvas (React-Grid-Layout)

  return (
    <div className="vibha-dashboard-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>📊 Vibha Dashboard</h1>
        <p style={{ color: '#666', margin: 0 }}>
          Dynamic dashboard system — Select a dashboard and refine with filters
          {selectedCategory && ` • Filter Active: ${selectedCategory}`}
        </p>
      </div>

      {/* ZONE 1: Controls (Fixed) */}
      <div className="vibha-zone-controls">
        <DashboardSelector selectedId={selectedDashboardId} onSelect={setSelectedDashboardId} />
        <ExportButtons
          dashboardName={dashboardConfig.name}
          data={chartData}
          kpis={kpiData}
          charts={chartsForExport}
        />
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
      </div>

      {/* ZONE 2: KPI Strip (Fixed, CSS Grid) */}
      {dashboardConfig.kpis.length > 0 && (
        <div className="vibha-zone-kpis">
          <DynamicKPIs kpis={dashboardConfig.kpis} data={kpiData} />
        </div>
      )}

      {/* Category Filter Badge */}
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

      {/* ZONE 3: Chart Canvas (Flexible, React-Grid-Layout) */}
      <div className="vibha-zone-charts-wrapper">
        <h3 style={{ marginBottom: '1.5rem' }}>Charts & Visualizations</h3>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
          💡 Click chart elements to filter • Drag card headers to rearrange • Export in 6 formats (PNG, JPG, SVG, PDF, PPTX, JSON)
        </p>

        <LayoutEngine
          layoutConfig={chartLayoutConfig}  // DAY 13: Pass layout matching chart IDs
          isEditMode={true}
          onLayoutChange={(newLayout) => {
            // TODO: Save layout to dashboard via PUT /api/v1/dashboards/:id
            // This will be implemented in v1.1 when Widget Settings Panel is added
            console.log('Layout changed:', newLayout)
          }}
        >
          {dashboardConfig.charts.map((chartConfig) => {
            if (!chartRefsMap.current.has(chartConfig.id)) {
              chartRefsMap.current.set(chartConfig.id, React.createRef<EChartsRendererHandle>())
            }
            const chartRef = chartRefsMap.current.get(chartConfig.id)!

            return (
              <Card
                key={chartConfig.id}
                title={chartConfig.title}
                subtitle={`Chart • ${chartConfig.type}`}
                actions={
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button
                      onClick={() => setShowChartExportMenu(prev => ({ ...prev, [chartConfig.id]: !prev[chartConfig.id] }))}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                      }}
                    >
                      📥 {showChartExportMenu[chartConfig.id] ? '▲' : '▼'}
                    </button>

                    {showChartExportMenu[chartConfig.id] && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        backgroundColor: '#ffffff',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        minWidth: '160px',
                        marginTop: '4px',
                      }}>
                        {EXPORT_FORMATS.map(format => (
                          <button
                            key={format}
                            onClick={() => handleChartExport(chartConfig.id, format)}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '0.75rem 1rem',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderBottom: format !== EXPORT_FORMATS[EXPORT_FORMATS.length - 1] ? '1px solid #eee' : 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              color: '#333',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            {format.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                }
              >
                {loading && <div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>Loading chart...</div>}
                {!loading && (
                  <EChartsRenderer
                    ref={chartRef}
                    type={chartConfig.type as any}
                    data={chartData}
                    title="" // Title moved to Card header
                    height={300}
                  />
                )}
              </Card>
            )
          })}
        </LayoutEngine>
      </div>

      {/* Data Table (Below charts) */}
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
