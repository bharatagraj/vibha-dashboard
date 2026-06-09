import React, { useState } from 'react';
import { useSchemaFetch } from '../hooks/useSchemaFetch';

export function SchemaDebugger() {
  const [domain, setDomain] = useState('greenops');
  const [table, setTable] = useState('emissions');
  const { data, loading, error } = useSchemaFetch(domain, table);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }}>
      <h2>📋 Schema Debugger</h2>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Domain:
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            style={{ marginLeft: '8px', padding: '4px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Table:
          <input
            type="text"
            value={table}
            onChange={(e) => setTable(e.target.value)}
            style={{ marginLeft: '8px', padding: '4px' }}
          />
        </label>
      </div>

      {loading && <p style={{ color: 'blue' }}>⏳ Loading schema...</p>}

      {error && (
        <div style={{ color: 'red', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
          ❌ Error: {error.message}
        </div>
      )}

      {data && (
        <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '4px' }}>
          <h3>✅ Schema Loaded</h3>
          <div style={{ marginBottom: '10px' }}>
            <strong>Domain:</strong> {data.domain}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Table:</strong> {data.table}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Columns ({data.columns.length}):</strong>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#ddd' }}>
                <th style={{ border: '1px solid #999', padding: '8px', textAlign: 'left' }}>Name</th>
                <th style={{ border: '1px solid #999', padding: '8px', textAlign: 'left' }}>Type</th>
                <th style={{ border: '1px solid #999', padding: '8px', textAlign: 'center' }}>Nullable</th>
                <th style={{ border: '1px solid #999', padding: '8px', textAlign: 'center' }}>Indexed</th>
              </tr>
            </thead>
            <tbody>
              {data.columns.map((col) => (
                <tr key={col.name}>
                  <td style={{ border: '1px solid #999', padding: '8px' }}>
                    <code>{col.name}</code>
                  </td>
                  <td style={{ border: '1px solid #999', padding: '8px' }}>
                    <code style={{ backgroundColor: '#e8f4f8', padding: '2px 6px', borderRadius: '3px' }}>
                      {col.type}
                    </code>
                  </td>
                  <td style={{ border: '1px solid #999', padding: '8px', textAlign: 'center' }}>
                    {col.nullable ? '✓' : '✗'}
                  </td>
                  <td style={{ border: '1px solid #999', padding: '8px', textAlign: 'center' }}>
                    {col.indexed ? '✓' : '✗'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
