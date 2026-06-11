/**
 * EChartsRenderer.tsx — Vibha Dashboard Platform
 * Day 11, Hours 1-2: ECharts foundation + auto-detection
 * Day 12, Hour 1: Added click event handler for drill-down filtering
 * Day 12, Hour 2: Added event bus emission for cross-chart filtering
 *
 * ECharts-based renderer. Used by DashboardHome and DashboardViewer.
 */

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { useChartEventEmitter } from '@/hooks/useChartEvents';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KpiMetadata {
  database_column: string;
  display_name: string;
  unit: string | null;
  aggregation: string;
  decimals: number;
  data_type: string | null;
}

export type DataRow = Record<string, any>;

export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'heatmap' | 'scatter' | 'gauge';

export interface EChartsRendererProps {
  type: ChartType;
  data: DataRow[];
  kpis?: KpiMetadata[];
  xAxis?: string;
  yAxis?: string;
  title?: string;
  smooth?: boolean;
  showLegend?: boolean;
  height?: number;
  onChartClick?: (categoryName: string) => void; // Direct callback (Hour 1)
}

// ---------------------------------------------------------------------------
// Auto-Detection
// ---------------------------------------------------------------------------

function isNumericColumn(data: DataRow[], column: string): boolean {
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const val = data[i]?.[column];
    if (val !== null && val !== undefined) {
      const n = typeof val === 'number' ? val : parseFloat(val);
      if (Number.isFinite(n)) continue;
      return false;
    }
  }
  return true;
}

export function autoDetectKpis(data: DataRow[]): KpiMetadata[] {
  if (data.length === 0) return [];

  const columns = Object.keys(data[0]);
  return columns.map((col) => {
    const isNumeric = isNumericColumn(data, col);
    return {
      database_column: col,
      display_name: col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' '),
      unit: isNumeric ? null : null,
      aggregation: isNumeric ? 'sum' : 'none',
      decimals: 2,
      data_type: isNumeric ? 'number' : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VIBHA_PALETTE = [
  '#2563eb', '#f59e0b', '#16a34a', '#dc2626', '#9333ea',
  '#0891b2', '#db2777', '#65a30d', '#ea580c', '#475569',
];

function isMeasure(kpi: KpiMetadata): boolean {
  if (kpi.aggregation && kpi.aggregation !== 'none') return true;
  return kpi.data_type === 'number';
}

function isDimension(kpi: KpiMetadata): boolean {
  return !isMeasure(kpi);
}

function toNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function findKpi(kpis: KpiMetadata[], column: string): KpiMetadata | undefined {
  return kpis.find((k) => k.database_column === column);
}

function axisLabel(kpis: KpiMetadata[], column: string): string {
  const kpi = findKpi(kpis, column);
  if (!kpi) return column;
  return kpi.unit ? `${kpi.display_name} (${kpi.unit})` : kpi.display_name;
}

function formatValue(value: number, kpi?: KpiMetadata): string {
  const decimals = kpi?.decimals ?? 2;
  const formatted = value.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
  return kpi?.unit ? `${formatted} ${kpi.unit}` : formatted;
}

export function resolveColumns(
  props: Pick<EChartsRendererProps, 'xAxis' | 'yAxis' | 'kpis' | 'data'>,
): { x: string | null; y: string | null; kpis: KpiMetadata[]; error: string | null } {
  const { data } = props;

  const kpis = props.kpis && props.kpis.length > 0
    ? props.kpis
    : autoDetectKpis(data);

  if (!kpis || kpis.length === 0) {
    return { x: null, y: null, kpis: [], error: 'No columns available in data.' };
  }

  const available = data.length > 0 ? Object.keys(data[0]) : [];
  const x = props.xAxis ?? kpis.find(isDimension)?.database_column ?? null;
  const y = props.yAxis ?? kpis.find(isMeasure)?.database_column ?? null;

  if (!x || !y) {
    return {
      x, y, kpis,
      error: !y
        ? 'No numeric column found for Y axis.'
        : 'No categorical column found for X axis.',
    };
  }
  if (data.length === 0) {
    return { x, y, kpis, error: 'No data rows available.' };
  }
  if (!available.includes(x)) {
    return { x, y, kpis, error: `Column "${x}" not in result.` };
  }
  if (!available.includes(y)) {
    return { x, y, kpis, error: `Column "${y}" not in result.` };
  }
  return { x, y, kpis, error: null };
}

// ---------------------------------------------------------------------------
// ECharts option builders
// ---------------------------------------------------------------------------

function buildCartesianOption(
  type: 'line' | 'bar' | 'area',
  data: DataRow[],
  kpis: KpiMetadata[],
  x: string,
  y: string,
  opts: { title?: string; smooth: boolean; showLegend: boolean },
): echarts.EChartsOption {
  const yKpi = findKpi(kpis, y);
  const categories = data.map((row) => String(row[x] ?? '—'));
  const values = data.map((row) => toNumber(row[y]));

  const seriesBase = {
    name: yKpi?.display_name ?? y,
    data: values,
    emphasis: { focus: 'series' as const },
    animationDuration: 600,
    animationEasing: 'cubicOut' as const,
  };

  const series: echarts.SeriesOption =
    type === 'bar'
      ? { ...seriesBase, type: 'bar', itemStyle: { borderRadius: [4, 4, 0, 0] } }
      : {
          ...seriesBase,
          type: 'line',
          smooth: opts.smooth,
          symbolSize: 8,
          lineStyle: { width: 3 },
          ...(type === 'area' ? { areaStyle: { opacity: 0.25 } } : {}),
        };

  return {
    color: VIBHA_PALETTE,
    title: opts.title
      ? { text: opts.title, left: 'left', textStyle: { fontSize: 15, fontWeight: 600 } }
      : undefined,
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) =>
        typeof v === 'number' ? formatValue(v, yKpi) : String(v ?? '—'),
    },
    legend: opts.showLegend ? { bottom: 0 } : undefined,
    grid: { left: 56, right: 24, top: opts.title ? 48 : 24, bottom: opts.showLegend ? 48 : 32 },
    xAxis: {
      type: 'category',
      data: categories,
      name: axisLabel(kpis, x),
      nameLocation: 'middle',
      nameGap: 28,
      axisLabel: { rotate: categories.length > 8 ? 30 : 0 },
    },
    yAxis: {
      type: 'value',
      name: axisLabel(kpis, y),
      nameLocation: 'middle',
      nameGap: 44,
    },
    series: [series],
  };
}

function buildPieOption(
  data: DataRow[],
  kpis: KpiMetadata[],
  x: string,
  y: string,
  opts: { title?: string; showLegend: boolean },
): echarts.EChartsOption {
  const yKpi = findKpi(kpis, y);
  const pieData = data
    .map((row) => ({ name: String(row[x] ?? '—'), value: toNumber(row[y]) ?? 0 }))
    .filter((d) => d.value > 0);

  return {
    color: VIBHA_PALETTE,
    title: opts.title
      ? { text: opts.title, left: 'left', textStyle: { fontSize: 15, fontWeight: 600 } }
      : undefined,
    tooltip: {
      trigger: 'item',
      formatter: (params: any) =>
        `${params.name}: ${formatValue(params.value, yKpi)} (${params.percent}%)`,
    },
    legend: opts.showLegend ? { bottom: 0, type: 'scroll' } : undefined,
    series: [
      {
        name: yKpi?.display_name ?? y,
        type: 'pie',
        radius: ['38%', '68%'],
        center: ['50%', '46%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{d}%' },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 600 },
          scaleSize: 6,
        },
        data: pieData,
        animationType: 'scale',
        animationEasing: 'elasticOut',
      },
    ],
  };
}

export function buildChartOption(type: ChartType, data: DataRow[], kpis: KpiMetadata[], x: string, y: string, opts: { title?: string; smooth: boolean; showLegend: boolean }): echarts.EChartsOption | null {
  if (type === 'pie') return buildPieOption(data, kpis, x, y, { title: opts.title, showLegend: opts.showLegend });
  return buildCartesianOption(type, data, kpis, x, y, opts);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function EChartsRenderer(props: EChartsRendererProps) {
  const { type, data, kpis: providedKpis, xAxis, yAxis, title, smooth = true, showLegend = true, height = 360, onChartClick } = props;

  const resolveResult = resolveColumns({ xAxis, yAxis, kpis: providedKpis, data });
  const { x, y, kpis, error } = resolveResult;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  // NEW (Hour 2): Event emitter for cross-chart filtering
  const emitChartEvent = useChartEventEmitter();

  const option = error ? null : buildChartOption(type, data, kpis, x ?? '', y ?? '', { title, smooth, showLegend });

  useEffect(() => {
    if (!containerRef.current) return;
    chartRef.current = echarts.init(containerRef.current);

    const handleResize = () => chartRef.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (chartRef.current && option) {
      chartRef.current.setOption(option, { notMerge: false });
    }
  }, [option]);

  // Click handler: call direct callback (Hour 1) + emit event (Hour 2)
  useEffect(() => {
    if (!chartRef.current) return;

    const handleChartClick = (params: any) => {
      if (params.name) {
        // Hour 1: Direct callback to parent
        onChartClick?.(params.name);

        // Hour 2: Emit event for cross-chart filtering
        emitChartEvent('SELECT_CATEGORY', { categoryName: params.name });
      }
    };

    chartRef.current.on('click', handleChartClick);

    return () => {
      if (chartRef.current) {
        chartRef.current.off('click', handleChartClick);
      }
    };
  }, [onChartClick, emitChartEvent]);

  if (error) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          background: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: 8,
          gap: 8,
        }}
        data-testid="chart-fallback"
      >
        <span style={{ fontSize: 28 }}>📊</span>
        <strong>Chart cannot be rendered</strong>
        <span style={{ fontSize: 13 }}>{error}</span>
        {data.length > 0 && (
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            Available columns: {Object.keys(data[0]).join(', ')}
          </span>
        )}
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: '100%', height }} data-testid="chart-canvas" />;
}

export { EChartsRenderer };
export default EChartsRenderer;