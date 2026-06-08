import { DashboardConfig } from '@/types/dashboard'

export const DASHBOARDS: Record<string, DashboardConfig> = {
  co2_dashboard: {
    id: 'co2_dashboard',
    name: 'CO2 Emissions Dashboard',
    description: 'Track carbon footprint across inventory',
    table: 'emissions',
    domain: 'sustainability',
    kpis: [
      {
        id: 'total_co2e',
        label: 'Total CO2e',
        metric: 'SUM(co2e)',
        format: 'number',
      },
      {
        id: 'embedded_co2e',
        label: 'Embedded CO2e',
        metric: 'SUM(embedded_co2e)',
        format: 'number',
      },
      {
        id: 'usage_co2e',
        label: 'Usage CO2e',
        metric: 'SUM(usage_co2e)',
        format: 'number',
      },
    ],
    filters: [
      {
        id: 'category',
        column: 'category',
        label: 'Category',
        type: 'select',
      },
      {
        id: 'location',
        column: 'location',
        label: 'Location',
        type: 'select',
      },
    ],
    charts: [
      {
        id: 'co2_by_category',
        type: 'pie',
        title: 'CO2 by Category',
        xAxis: 'category',
        yAxis: 'co2e',
      },
      {
        id: 'co2_trend',
        type: 'line',
        title: 'CO2 Trend Over Time',
        xAxis: 'date',
        yAxis: 'co2e',
      },
    ],
  },

  sales_dashboard: {
    id: 'sales_dashboard',
    name: 'Sales Dashboard',
    description: 'Monitor sales performance by region',
    table: 'sales',
    domain: 'sales',
    kpis: [
      {
        id: 'total_revenue',
        label: 'Total Revenue',
        metric: 'SUM(revenue)',
        format: 'currency',
      },
      {
        id: 'order_count',
        label: 'Order Count',
        metric: 'COUNT(order_id)',
        format: 'number',
      },
      {
        id: 'avg_order_value',
        label: 'Avg Order Value',
        metric: 'AVG(revenue)',
        format: 'currency',
      },
    ],
    filters: [
      {
        id: 'region',
        column: 'region',
        label: 'Region',
        type: 'select',
      },
      {
        id: 'product_type',
        column: 'product_type',
        label: 'Product Type',
        type: 'select',
      },
      {
        id: 'date_range',
        column: 'date',
        label: 'Date Range',
        type: 'date',
      },
    ],
    charts: [
      {
        id: 'revenue_by_region',
        type: 'bar',
        title: 'Revenue by Region',
        xAxis: 'region',
        yAxis: 'revenue',
      },
      {
        id: 'sales_trend',
        type: 'line',
        title: 'Sales Trend',
        xAxis: 'date',
        yAxis: 'revenue',
      },
      {
        id: 'product_breakdown',
        type: 'pie',
        title: 'Sales by Product Type',
        xAxis: 'product_type',
        yAxis: 'revenue',
      },
    ],
  },
}

export const getDashboardConfig = (dashboardId: string): DashboardConfig | null => {
  return DASHBOARDS[dashboardId] || null
}

export const listDashboards = () => {
  return Object.values(DASHBOARDS).map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
  }))
}
