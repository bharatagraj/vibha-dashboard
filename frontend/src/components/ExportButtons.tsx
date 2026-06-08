import React from 'react'
import { exportDataAsCSV, exportDashboardAsPDF } from '@/services/exportService'

interface ExportButtonsProps {
  dashboardName: string
  data: Record<string, unknown>[]
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ dashboardName, data }) => {
  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '1rem',
    }}>
      <button
        onClick={() => exportDataAsCSV(data, dashboardName)}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#27ae60',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.9rem',
        }}
      >
        📥 Export CSV
      </button>
      <button
        onClick={() => exportDashboardAsPDF(dashboardName)}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#e74c3c',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.9rem',
        }}
      >
        📄 Export PDF
      </button>
      <button
        onClick={() => window.print()}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.9rem',
        }}
      >
        🖨️ Print
      </button>
    </div>
  )
}
