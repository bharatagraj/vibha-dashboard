/**
 * Dashboard Selector Component
 * List saved dashboards and load them
 */

import React, { useState, useEffect } from 'react';
import { DashboardConfig } from '../types/schema';

interface DashboardListItem {
  id: string;
  name: string;
  domain: string;
  table: string;
  created_at: string;
  kpi_count: number;
  chart_count: number;
}

interface LoadedDashboard extends DashboardListItem {
  kpis: any[];
  filters: any[];
  charts: any[];
}

export function DashboardSelector() {
  const [dashboards, setDashboards] = useState<DashboardListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadedDashboard, setLoadedDashboard] = useState<LoadedDashboard | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch list of dashboards on mount
  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/v1/dashboards');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setDashboards(data);
    } catch (err) {
      console.error('❌ Error fetching dashboards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboards');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDashboard = async (id: string) => {
    setLoadingDetail(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/dashboards/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setSelectedId(id);
      setLoadedDashboard(data);
      console.log('✅ Loaded dashboard:', data);
    } catch (err) {
      console.error('❌ Error loading dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💾 Saved Dashboards</h1>
        <p style={{ color: '#666' }}>Load and manage your custom dashboards</p>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1.5rem',
          color: '#c62828',
        }}>
          ❌ {error}
          <button
            onClick={fetchDashboards}
            style={{
              marginLeft: '1rem',
              padding: '0.4rem 0.8rem',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Left: Dashboard List */}
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Available Dashboards</h2>

          {loading ? (
            <p style={{ color: 'blue' }}>⏳ Loading dashboards...</p>
          ) : dashboards.length === 0 ? (
            <p style={{ color: '#666' }}>No dashboards found. Create one in the Dashboard Builder!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {dashboards.map((dash) => (
                <button
                  key={dash.id}
                  onClick={() => handleLoadDashboard(dash.id)}
                  disabled={loadingDetail && selectedId === dash.id}
                  style={{
                    padding: '1rem',
                    border: selectedId === dash.id ? '2px solid #0066cc' : '1px solid #ddd',
                    backgroundColor: selectedId === dash.id ? '#e3f2fd' : '#fff',
                    borderRadius: '4px',
                    cursor: loadingDetail && selectedId === dash.id ? 'wait' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    {loadingDetail && selectedId === dash.id ? '⏳ Loading...' : dash.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    {dash.domain} → {dash.table}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>
                    📊 {dash.kpi_count} KPIs | 📈 {dash.chart_count} Charts
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Dashboard Preview */}
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Dashboard Preview</h2>

          {selectedId && loadedDashboard ? (
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1.5rem',
              backgroundColor: '#fafafa',
            }}>
              {/* Header */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{loadedDashboard.name}</h3>
                <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                  Created: {new Date(loadedDashboard.created_at).toLocaleString()}
                </p>
              </div>

              {/* Summary */}
              <div style={{
                backgroundColor: '#f0f7ff',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1.5rem',
              }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>📊 Configuration:</p>
                <p style={{ margin: '0', fontSize: '0.9rem' }}>
                  <strong>Domain:</strong> {loadedDashboard.domain} | <strong>Table:</strong> {loadedDashboard.table}
                </p>
              </div>

              {/* KPIs */}
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>
                  📈 KPIs ({loadedDashboard.kpis.length}):
                </p>
                {loadedDashboard.kpis.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                    {loadedDashboard.kpis.map((kpi, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: '#e8f5e9',
                          padding: '0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.9rem',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontWeight: 'bold' }}>{kpi.column}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{kpi.format}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#999' }}>No KPIs configured</p>
                )}
              </div>

              {/* Charts */}
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>
                  📊 Charts ({loadedDashboard.charts.length}):
                </p>
                {loadedDashboard.charts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {loadedDashboard.charts.map((chart, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: '#fff3e0',
                          padding: '0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.9rem',
                        }}
                      >
                        📈 {chart.title} ({chart.type})
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#999' }}>No charts configured</p>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setSelectedId(null);
                    setLoadedDashboard(null);
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Close
                </button>
                <button
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#0066cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  📝 Edit Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              border: '2px dashed #ddd',
              borderRadius: '8px',
              padding: '3rem',
              textAlign: 'center',
              color: '#999',
            }}>
              <p style={{ margin: '0', fontSize: '1.2rem' }}>👈 Select a dashboard to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
