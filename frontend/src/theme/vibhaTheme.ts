/**
 * Vibha Dashboard Platform — Custom ECharts Theme v1.0
 * Deploy to: frontend/src/theme/vibhaTheme.ts
 * 
 * Registers a custom ECharts theme that inherits from design-tokens.css
 * Call once at app startup: echarts.registerTheme('vibha', vibhaTheme)
 * 
 * Then use in every chart: new echarts.init(container, 'vibha')
 */

import * as echarts from 'echarts'

/**
 * Vibha color palette — matches design-tokens.css --vibha-chart-* vars
 * Muted, professional, color-blind safe
 */
const VIBHA_PALETTE = [
  '#0e7c66',  // green (brand)
  '#3b82a0',  // steel blue
  '#c2703d',  // terracotta
  '#7c6fb0',  // muted violet
  '#b0527c',  // muted rose
  '#5a8a3c',  // olive green
  '#8c8c5a',  // khaki
  '#5f6b7a',  // slate
]

/**
 * Text colors
 */
const TEXT_PRIMARY = '#111827'
const TEXT_SECONDARY = '#374151'
const TEXT_MUTED = '#6b7280'
const BORDER_SUBTLE = '#f0f1f3'

/**
 * ECharts theme object
 * See: https://echarts.apache.org/en/api.html#echarts.registerTheme
 */
const vibhaTheme = {
  color: VIBHA_PALETTE,

  /* ============ Background & Borders ============ */
  backgroundColor: 'transparent',

  /* ============ Title ============ */
  title: {
    textStyle: {
      color: TEXT_PRIMARY,
      fontSize: 14,
      fontWeight: 500,
    },
    subtextStyle: {
      color: TEXT_MUTED,
      fontSize: 12,
    },
  },

  /* ============ Line ============ */
  line: {
    itemStyle: {
      borderWidth: 1,
    },
    lineStyle: {
      width: 2,
    },
    symbolSize: 5,
    smooth: false,
  },

  /* ============ Bar ============ */
  bar: {
    itemStyle: {
      barBorderRadius: 4,
    },
  },

  /* ============ Pie ============ */
  pie: {
    itemStyle: {
      borderColor: '#ffffff',
      borderWidth: 2,
    },
  },

  /* ============ Grid (axes container) ============ */
  grid: {
    borderColor: BORDER_SUBTLE,
  },

  /* ============ Category Axis (X-axis usually) ============ */
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: BORDER_SUBTLE,
        width: 1,
      },
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: TEXT_MUTED,
      fontSize: 12,
      margin: 8,
    },
    splitLine: {
      show: false,
    },
  },

  /* ============ Value Axis (Y-axis usually) ============ */
  valueAxis: {
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: TEXT_MUTED,
      fontSize: 12,
      margin: 8,
    },
    splitLine: {
      lineStyle: {
        color: BORDER_SUBTLE,
        width: 1,
        type: 'solid',
      },
    },
  },

  /* ============ Legend ============ */
  legend: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    textStyle: {
      color: TEXT_SECONDARY,
      fontSize: 12,
    },
    itemGap: 12,
    padding: [8, 0, 0, 0],
  },

  /* ============ Tooltip ============ */
  tooltip: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    textStyle: {
      color: '#ffffff',
      fontSize: 12,
    },
    padding: [8, 12],
    shadowBlur: 12,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
  },

  /* ============ Emphasis (hover) ============ */
  emphasis: {
    itemStyle: {
      borderColor: TEXT_MUTED,
    },
    lineStyle: {
      width: 3,
    },
  },
} as const

/**
 * Register the theme globally
 * Call this once at app startup, e.g., in App.tsx or main.tsx after ECharts import
 */
export function registerVibhaTheme() {
  echarts.registerTheme('vibha', vibhaTheme as Parameters<typeof echarts.registerTheme>[1])
}

export default vibhaTheme
