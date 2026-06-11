/**
 * DataTable.tsx — Vibha Dashboard Platform
 * Day 12, Hour 1: Table component for displaying filtered/unfiltered data rows
 *
 * Displays chart data in tabular format with optional filter badge.
 * Day 13: Made responsive and flexible with container-based sizing.
 */

import React from 'react';

export interface DataTableProps {
  data: Record<string, any>[];
  filteredBy?: string | null; // e.g. "Electronics" when pie slice clicked
  onClearFilter?: () => void;
}

export const DataTable: React.FC<DataTableProps> = ({ data, filteredBy, onClearFilter }) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          padding: '2rem',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#64748b',
        }}
      >
        No data available
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div style={{ marginTop: '2rem', width: '100%' }}>
      {/* Filter badge + clear button */}
      {filteredBy && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#dbeafe',
            border: '1px solid #0ea5e9',
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: '#0369a1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            ✓ Active Filter: <strong>{filteredBy}</strong>
          </span>
          <button
            onClick={onClearFilter}
            style={{
              background: 'none',
              border: 'none',
              color: '#0369a1',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: 0,
              lineHeight: 1,
            }}
            title="Clear filter"
          >
            ✕
          </button>
        </div>
      )}

      {/* Table — Day 13: Flexible, responsive, no horizontal scroll */}
      <div
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          backgroundColor: 'white',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
            tableLayout: 'auto', // Columns auto-adjust to content
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {columns.map((col) => (
                <th
                  key={col}
                  style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#475569',
                    wordBreak: 'break-word', // Allow column headers to wrap if needed
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

                  // Format numbers
                  if (typeof value === 'number') {
                    displayValue = value.toLocaleString('en-IN', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    });
                  }

                  return (
                    <td
                      key={`${idx}-${col}`}
                      style={{
                        padding: '0.75rem 1rem',
                        color: '#1e293b',
                        wordBreak: 'break-word', // Allow cell content to wrap
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

      {/* Row count footer */}
      <div
        style={{
          marginTop: '0.75rem',
          fontSize: '0.85rem',
          color: '#64748b',
          textAlign: 'right',
        }}
      >
        Showing {data.length} row{data.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default DataTable;
