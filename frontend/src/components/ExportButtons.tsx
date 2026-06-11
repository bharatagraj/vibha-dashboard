/**
 * ExportButtons.tsx — Vibha Dashboard Platform
 * Day 12, Hour 3: Dashboard multi-format export (CSV, PDF, Excel, PPTX, Print)
 */

import React from 'react'
import { exportDataAsCSV, exportDashboardAsPDF } from '@/services/exportService'
import { exportDashboardAsExcel, exportDashboardAsPPTX } from '@/services/dashboardExport'

interface ExportButtonsProps {
  dashboardName: string
  data: Record<string, unknown>[]
  kpis?: Record<string, any>
  charts?: Array<{ title: string; data: Record<string, any>[] }>
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ 
  dashboardName, 
  data,
  kpis = {},
  charts = [],
}) => {
  const handleExcelExport = () => {
    const exportData = {
      dashboardName,
      kpis,
      charts,
      tableData: data,
    }
    exportDashboardAsExcel(exportData)
  }

  const handlePDFExport = () => {
    const exportData = {
      dashboardName,
      kpis,
      charts,
      tableData: data,
    }
    exportDashboardAsPDF(exportData)
  }

  const handlePPTXExport = () => {
    const exportData = {
      dashboardName,
      kpis,
      charts,
      tableData: data,
    }
    exportDashboardAsPPTX(exportData)
  }

  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '1rem',
      flexWrap: 'wrap',
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
          fontWeight: 500,
          transition: 'background-color 0.2s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#229954')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#27ae60')}
        title="Export data as CSV (data only)"
      >
        📊 Export CSV
      </button>

      <button
        onClick={handlePDFExport}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#e74c3c',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 500,
          transition: 'background-color 0.2s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#c0392b')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#e74c3c')}
        title="Export complete dashboard as PDF (charts, KPIs, data)"
      >
        📄 Export PDF
      </button>

      <button
        onClick={handleExcelExport}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#27ae60',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 500,
          transition: 'background-color 0.2s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#229954')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#27ae60')}
        title="Export complete dashboard as Excel (multiple sheets)"
      >
        📈 Export Excel
      </button>

      <button
        onClick={handlePPTXExport}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#d35400',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 500,
          transition: 'background-color 0.2s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#a04000')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#d35400')}
        title="Export complete dashboard as PowerPoint (4 slides)"
      >
        🎯 Export PowerPoint
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
          fontWeight: 500,
          transition: 'background-color 0.2s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2980b9')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3498db')}
        title="Print dashboard"
      >
        🖨️ Print
      </button>
    </div>
  )
}

export default ExportButtons
