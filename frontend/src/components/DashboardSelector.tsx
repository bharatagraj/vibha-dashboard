import React from 'react'
import { listDashboards } from '@/data/dashboards'

interface DashboardSelectorProps {
  selectedId: string
  onSelect: (id: string) => void
}

export const DashboardSelector: React.FC<DashboardSelectorProps> = ({
  selectedId,
  onSelect,
}) => {
  const dashboards = listDashboards()

  return (
    <div style={{ marginBottom: '2rem', borderBottom: '1px solid #ddd', paddingBottom: '1rem' }}>
      <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>📊 Dashboards</h2>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {dashboards.map((dashboard) => (
          <button
            key={dashboard.id}
            onClick={() => onSelect(dashboard.id)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: selectedId === dashboard.id ? '#0066cc' : '#eee',
              color: selectedId === dashboard.id ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: selectedId === dashboard.id ? '600' : '400',
            }}
          >
            {dashboard.name}
          </button>
        ))}
      </div>
    </div>
  )
}
