/**
 * Dashboard Builder Component
 * Step-by-step wizard for creating dashboards without code
 * 
 * Step 1: Select analytics scope
 * Step 2: Configure KPIs
 * Step 3: Add charts and save
 */

import React, { useState, useMemo } from 'react';
import { useSchemaFetch } from '../hooks/useSchemaFetch';
import { useScopes } from '../hooks/useScopes';
import { DashboardConfig, KPIConfig, ChartConfig } from '../types/schema';

type WizardStep = 'step1' | 'step2' | 'step3';

interface FormState {
  domain: string;
  table: string;
  kpis: KPIConfig[];
  filters: [];
  charts: ChartConfig[];
}

interface DashboardBuilderProps {
  editDashboardId?: string;
  editDashboardData?: {
    name: string;
    domain: string;
    table: string;
    kpis: KPIConfig[];
    filters: [];
    charts: ChartConfig[];
  };
  onEditComplete?: () => void;
}


const CHART_TYPES = [
  { id: 'bar', label: 'Bar Chart', icon: '📊', description: 'Compare values across categories' },
  { id: 'line', label: 'Line Chart', icon: '📈', description: 'Show trends over time' },
  { id: 'pie', label: 'Pie Chart', icon: '🥧', description: 'Show proportions' },
  { id: 'area', label: 'Area Chart', icon: '📉', description: 'Show cumulative trends' },
  { id: 'table', label: 'Data Table', icon: '📋', description: 'Display raw data' },
];

export function DashboardBuilder({ editDashboardId, editDashboardData, onEditComplete }: DashboardBuilderProps = {}) {
  const [step, setStep] = useState<WizardStep>('step1');
  const [form, setForm] = useState<FormState>({
    domain: 'greenops',
    table: 'emissions',
    kpis: [],
    filters: [],
    charts: [],
  });
  const [dashboardName, setDashboardName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  const { data: schema, loading: schemaLoading, error: schemaError } = useSchemaFetch(
    form.domain,
    form.table
  );

  const { scopes, loading: scopesLoading, error: scopesError } = useScopes();

  // Load dashboard data if in edit mode
  React.useEffect(() => {
    if (editDashboardData) {
      setForm({
        domain: editDashboardData.domain,
        table: editDashboardData.table,
        kpis: editDashboardData.kpis,
        filters: editDashboardData.filters,
        charts: editDashboardData.charts,
      });
      setStep('step1');
    }
  }, [editDashboardData]);

  // Fetch available tables on mount
  React.useEffect(() => {
    const fetchTables = async () => {
      setLoadingTables(true);
      try {
        const response = await fetch('http://localhost:8000/api/v1/schemas/tables');
        if (response.ok) {
          const data = await response.json();
          setAvailableTables(data.tables);
        }
      } catch (err) {
        console.error('❌ Error fetching tables:', err);
      } finally {
        setLoadingTables(false);
      }
    };
    fetchTables();
  }, []);

  const handleAddKPI = (column: string) => {
    const newKPI: KPIConfig = {
      column,
      format: 'number',
      label: column.toUpperCase(),
    };
    setForm({
      ...form,
      kpis: [...form.kpis, newKPI],
    });
  };

  const handleRemoveKPI = (index: number) => {
    setForm({
      ...form,
      kpis: form.kpis.filter((_, i) => i !== index),
    });
  };

  const handleUpdateKPIFormat = (
    index: number,
    format: 'number' | 'currency' | 'percent' | 'date'
  ) => {
    const updated = [...form.kpis];
    updated[index].format = format;
    setForm({ ...form, kpis: updated });
  };

  const handleAddChart = (chartType: string) => {
    const newChart: ChartConfig = {
      type: chartType as any,
      title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
      xAxis: schema?.columns[0].name || 'x',
      yAxis: form.kpis[0]?.column || 'y',
    };
    setForm({
      ...form,
      charts: [...form.charts, newChart],
    });
  };

  const handleRemoveChart = (index: number) => {
    setForm({
      ...form,
      charts: form.charts.filter((_, i) => i !== index),
    });
  };

  const handleSaveDashboard = async () => {
    setSaving(true);
    setSaveStatus('idle');
    setSaveMessage('');

    try {
      const payload = {
        name: dashboardName || editDashboardData?.name || `${form.domain.toUpperCase()} - ${form.table}`,
        domain: form.domain,
        table: form.table,
        kpis: form.kpis,
        filters: form.filters,
        charts: form.charts,
      };

      const isUpdate = !!editDashboardId;
      const url = isUpdate 
        ? `http://localhost:8000/api/v1/dashboards/${editDashboardId}`
        : 'http://localhost:8000/api/v1/dashboards';
      const method = isUpdate ? 'PUT' : 'POST';

      console.log(`📊 ${isUpdate ? 'Updating' : 'Saving'} dashboard:`, payload);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Dashboard ${isUpdate ? 'updated' : 'saved'} with ID:`, result.id);

      setSaveStatus('success');
      setSaveMessage(`✅ Dashboard ${isUpdate ? 'updated' : 'saved'} successfully! (ID: ${result.id})`);

      // Call callback if provided (for edit mode)
      if (isUpdate && onEditComplete) {
        setTimeout(() => onEditComplete(), 1500);
      }

      // Reset after success
      setTimeout(() => {
        setForm({
          domain: 'greenops',
          table: 'emissions',
          kpis: [],
          filters: [],
          charts: [],
        });
        setStep('step1');
        setSaveStatus('idle');
        setDashboardName("");
      }, 2000);
    } catch (err) {
      console.error('❌ Save error:', err);
      setSaveStatus('error');
      setSaveMessage(`❌ Error ${editDashboardId ? 'updating' : 'saving'} dashboard: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const goToStep = (targetStep: WizardStep) => {
    setStep(targetStep);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎨 Dashboard Builder</h1>
        <p style={{ color: '#666' }}>Create a custom dashboard in 3 steps</p>
      </div>

      {/* Progress Indicator */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {['step1', 'step2', 'step3'].map((s, i) => {
          const isCompleted = (s === 'step1' && (step === 'step2' || step === 'step3')) ||
                             (s === 'step2' && step === 'step3');
          const isActive = step === s;
          return (
            <div
              key={s}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: isActive ? '#0066cc' : isCompleted ? '#4CAF50' : '#ddd',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                }}
              >
                {isCompleted ? '✓' : i + 1}
              </div>
              <span style={{ fontWeight: isActive ? 'bold' : 'normal' }}>
                {i === 0 ? 'Select Scope' : i === 1 ? 'KPIs' : 'Charts'}
              </span>
              {i < 2 && <div style={{ width: '2rem', height: '2px', backgroundColor: '#ddd' }} />}
            </div>
          );
        })}
      </div>

      {/* STEP 1: Analytics Scope Selection */}
      {step === 'step1' && (
        <div style={{ border: '1px solid #ddd', padding: '2rem', borderRadius: '8px' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Step 1: Select Analytics Scope</h2>

          {scopesLoading && <p style={{ color: 'blue' }}>⏳ Loading scopes...</p>}
          {scopesError && <p style={{ color: 'red' }}>❌ Error: {scopesError}</p>}

          {!scopesLoading && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Select Analytics Scope:
              </label>
              <select
                onChange={(e) => {
                  const scope = scopes.find(s => s.id === e.target.value);
                  if (scope) {
                    const source = scope.query_definition.sources?.[0];
                    if (source) {
                      setForm({
                        ...form,
                        domain: source.domain,
                        table: source.table,
                      });
                      console.log('📊 Selected scope:', scope.scope_name);
                    }
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
              >
                <option value="">-- Select a scope --</option>
                {scopes.map((scope) => (
                  <option key={scope.id} value={scope.id}>
                    📊 {scope.scope_name} ({scope.scope_type})
                  </option>
                ))}
              </select>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Dashboard Name (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g., Q2 Emissions Report"
                  value={dashboardName}
                  onChange={(e) => setDashboardName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '1rem',
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Dashboard Name (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g., Q2 Emissions Report"
                  value={dashboardName}
                  onChange={(e) => setDashboardName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '1rem',
                  }}
                />
              </div>
              {form.domain && (
                <p style={{ marginTop: '0.75rem', color: '#666', fontSize: '0.9rem' }}>
                  ✅ Domain: <strong>{form.domain}</strong> | Table: <strong>{form.table}</strong>
                </p>
              )}
            </div>
          )}

          {schemaLoading && <p style={{ color: 'blue' }}>⏳ Loading schema...</p>}
          {schemaError && <p style={{ color: 'red' }}>❌ Error: {schemaError.message}</p>}
          {schema && (
            <div style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>✅ Schema Available</p>
              <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>
                {schema.columns.length} columns found: {schema.columns.map((c) => c.name).join(', ')}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => goToStep('step2')}
              disabled={!schema}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: schema ? '#0066cc' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: schema ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              Next: Configure KPIs →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: KPI Configuration */}
      {step === 'step2' && (
        <div style={{ border: '1px solid #ddd', padding: '2rem', borderRadius: '8px' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Step 2: Configure KPIs</h2>

          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Select columns to display as Key Performance Indicators
          </p>

          {schema && (
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>Available Columns:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {schema.columns.map((col) => {
                  const isSelected = form.kpis.some((k) => k.column === col.name);
                  return (
                    <button
                      key={col.name}
                      onClick={() => !isSelected && handleAddKPI(col.name)}
                      disabled={isSelected}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: isSelected ? '#4CAF50' : '#f0f0f0',
                        color: isSelected ? 'white' : '#333',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: isSelected ? 'default' : 'pointer',
                        textAlign: 'left',
                        fontSize: '0.9rem',
                      }}
                    >
                      {isSelected ? '✓' : '+'} {col.name}
                      <br />
                      <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>({col.type})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {form.kpis.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>Selected KPIs ({form.kpis.length}):</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {form.kpis.map((kpi, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#e8f5e9',
                      padding: '0.75rem',
                      borderRadius: '4px',
                    }}
                  >
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>{kpi.label}</p>
                      <select
                        value={kpi.format}
                        onChange={(e) =>
                          handleUpdateKPIFormat(idx, e.target.value as any)
                        }
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.9rem',
                          borderRadius: '3px',
                          border: '1px solid #ccc',
                        }}
                      >
                        <option value="number">Number</option>
                        <option value="currency">Currency</option>
                        <option value="percent">Percent</option>
                        <option value="date">Date</option>
                      </select>
                    </div>
                    <button
                      onClick={() => handleRemoveKPI(idx)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
            <button
              onClick={() => goToStep('step1')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#ccc',
                color: '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ← Back
            </button>
            <button
              onClick={() => goToStep('step3')}
              disabled={form.kpis.length === 0}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: form.kpis.length > 0 ? '#0066cc' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: form.kpis.length > 0 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              Next: Add Charts →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Chart Selection & Save */}
      {step === 'step3' && (
        <div style={{ border: '1px solid #ddd', padding: '2rem', borderRadius: '8px' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Step 3: Add Charts & Save</h2>

          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Select chart types to visualize your data
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {CHART_TYPES.map((chart) => {
              const isSelected = form.charts.some((c) => c.type === chart.id);
              return (
                <button
                  key={chart.id}
                  onClick={() => !isSelected && handleAddChart(chart.id)}
                  disabled={isSelected}
                  style={{
                    padding: '1rem',
                    backgroundColor: isSelected ? '#4CAF50' : '#f0f0f0',
                    color: isSelected ? 'white' : '#333',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: isSelected ? 'default' : 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{chart.icon}</div>
                  <p style={{ margin: '0.5rem 0', fontWeight: 'bold' }}>{chart.label}</p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', opacity: 0.7 }}>
                    {chart.description}
                  </p>
                  {isSelected && <p style={{ margin: '0.5rem 0' }}>✓ Selected</p>}
                </button>
              );
            })}
          </div>

          {form.charts.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>Selected Charts ({form.charts.length}):</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {form.charts.map((chart, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#fff3e0',
                      padding: '0.75rem',
                      borderRadius: '4px',
                    }}
                  >
                    <p style={{ margin: 0 }}>
                      {CHART_TYPES.find((c) => c.id === chart.type)?.icon} {chart.title}
                    </p>
                    <button
                      onClick={() => handleRemoveChart(idx)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {saveStatus && (
            <div
              style={{
                padding: '1rem',
                backgroundColor: saveStatus === 'success' ? '#e8f5e9' : '#ffebee',
                color: saveStatus === 'success' ? '#2e7d32' : '#c62828',
                borderRadius: '4px',
                marginBottom: '1rem',
              }}
            >
              {saveMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
            <button
              onClick={() => goToStep('step2')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#ccc',
                color: '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleSaveDashboard}
              disabled={saving || form.charts.length === 0}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: form.charts.length > 0 && !saving ? '#4CAF50' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: form.charts.length > 0 && !saving ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              {saving ? '💾 Saving...' : '✅ Save Dashboard'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
