import React from 'react'
import { KPIConfig } from '@/types/dashboard'

interface DynamicKPIsProps {
  kpis: KPIConfig[]
  data: Record<string, any>
}

export const DynamicKPIs: React.FC<DynamicKPIsProps> = ({ kpis, data }) => {
  const formatValue = (value: number, format?: string): string => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`
      case 'number':
      default:
        return value.toLocaleString('en-US')
    }
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem',
    }}>
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          style={{
            padding: '1.5rem',
            backgroundColor: '#0066cc',
            color: 'white',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>
            {kpi.label}
          </p>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            {formatValue(data[kpi.id] || 0, kpi.format)}
          </p>
        </div>
      ))}
    </div>
  )
}
