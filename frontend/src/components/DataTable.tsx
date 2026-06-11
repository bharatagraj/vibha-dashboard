/**
 * DataTable.tsx — Vibha Dashboard Platform
 * Displays chart data in table format
 * Day 13: Now a resizable grid widget (resize handled by LayoutEngine)
 */

import React from 'react';

export interface DataTableProps {
  data: Record<string, any>[];
  filteredBy?: string | null;
  onClearFilter?: () => void;
}

export const DataTable: React.FC<DataTableProps> = ({ 
  data, 
  filteredBy, 
  onClearFilter,
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
        No data available
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Filter badge */}
      {filteredBy && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            backgroundColor: '#dbeafe',
            border: '1px solid #0ea5e9',
            borderRadius: '4px',
            marginBottom: '0.5rem',
            fontSize: '0.85rem',
            color: '#0369a1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>✓ Filter: <strong>{filteredBy}</strong></span>
          <button
            onClick={onClearFilter}
            style={{
              background: 'none',
              border: 'none',
              color: '#0369a1',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Scrollable table */}
      <div style={{ overflowY: 'auto', overflowX: 'hidden', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {columns.map((col) => (
                <th
                  key={col}
                  style={{
                    padding: '0.5rem 0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#475569',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  {col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: '1px solid #e2e8f0',
                  backgroundColor: idx % 2 === 0 ? 'white' : '#f8fafc',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f4f8')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'white' : '#f8fafc')}
              >
                {columns.map((col) => {
                  const value = row[col];
                  let displayValue = value;
                  if (typeof value === 'number') {
                    displayValue = value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                  }
                  return (
                    <td
                      key={`${idx}-${col}`}
                      style={{
                        padding: '0.5rem 0.75rem',
                        color: '#1e293b',
                      }}
                    >
                      {displayValue ?? '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
