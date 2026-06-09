/**
 * Dashboard Builder Component
 * Step-by-step wizard for creating dashboards without code
 * 
 * Step 1: Select data source (domain + table)
 * Step 2: Configure KPIs
 * Step 3: Add charts (deferred to Hour 4)
 */

import React, { useState, useMemo } from 'react';
import { useSchemaFetch } from '../hooks/useSchemaFetch';
import { DashboardConfig, KPIConfig } from '../types/schema';

type WizardStep = 'step1' | 'step2' | 'step3';

interface FormState {
  domain: string;
  table: string;
  kpis: KPIConfig[];
  filters: [];
  charts: [];
}

// Available domains and their tables (mock data for now)
const AVAILABLE_DOMAINS = {
  greenops: ['emissions', 'sales'],
  healthcare: ['patients', 'procedures'],
  ecommerce: ['orders', 'products'],
};

export function DashboardBuilder() {
  const [step, setStep] = useState<WizardStep>('step1');
  const [form, setForm] = useState<FormState>({
    domain: 'greenops',
    table: 'emissions',
    kpis: [],
    filters: [],
    charts: [],
  });

  // Fetch schema for current domain/table
  const { data: schema, loading: schemaLoading, error: schemaError } = useSchemaFetch(
    form.domain,
    form.table
  );

  // Get available tables for selected domain
  const availableTables = useMemo(() => {
    return AVAILABLE_DOMAINS[form.domain as keyof typeof AVAILABLE_DOMAINS] || [];
  }, [form.domain]);

  // Handle domain change
  const handleDomainChange = (newDomain: string) => {
    const tables = AVAILABLE_DOMAINS[newDomain as keyof typeof AVAILABLE_DOMAINS];
    setForm({
      ...form,
      domain: newDomain,
      table: tables?.[0] || '', // Auto-select first table
    });
  };

  // Handle table change
  const handleTableChange = (newTable: string) => {
    setForm({ ...form, table: newTable });
  };

  // Add KPI
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

  // Remove KPI
  const handleRemoveKPI = (index: number) => {
    setForm({
      ...form,
      kpis: form.kpis.filter((_, i) => i !== index),
    });
  };

  // Update KPI format
  const handleUpdateKPIFormat = (
    index: number,
    format: 'number' | 'currency' | 'percent' | 'date'
  ) => {
    const updated = [...form.kpis];
    updated[index].format = format;
    setForm({ ...form, kpis: updated });
  };

  // Navigation
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
        {['step1', 'step2', 'step3'].map((s, i) => (
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
                backgroundColor: step === s ? '#0066cc' : s < step ? '#4CAF50' : '#ddd',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
              }}
            >
              {s < step ? '✓' : i + 1}
            </div>
            <span style={{ fontWeight: step === s ? 'bold' : 'normal' }}>
              {i === 0 ? 'Data Source' : i === 1 ? 'KPIs' : 'Charts'}
            </span>
            {i < 2 && <div style={{ width: '2rem', height: '2px', backgroundColor: '#ddd' }} />}
          </div>
        ))}
      </div>

      {/* STEP 1: Data Source Selection */}
      {step === 'step1' && (
        <div style={{ border: '1px solid #ddd', padding: '2rem', borderRadius: '8px' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Step 1: Select Your Data Source</h2>

          {/* Domain Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Domain:
            </label>
            <select
              value={form.domain}
              onChange={(e) => handleDomainChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            >
              {Object.keys(AVAILABLE_DOMAINS).map((domain) => (
                <option key={domain} value={domain}>
                  {domain.charAt(0).toUpperCase() + domain.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Table Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Table:
            </label>
            <select
              value={form.table}
              onChange={(e) => handleTableChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            >
              {availableTables.map((table) => (
                <option key={table} value={table}>
                  {table.charAt(0).toUpperCase() + table.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Schema Preview */}
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

          {/* Navigation */}
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

          {/* Available Columns */}
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
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>{col.name}</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{col.type}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected KPIs */}
          {form.kpis.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Selected KPIs:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {form.kpis.map((kpi, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid #ddd',
                      padding: '1rem',
                      borderRadius: '4px',
                      backgroundColor: '#f9f9f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{kpi.column}</p>
                      <select
                        value={kpi.format}
                        onChange={(e) =>
                          handleUpdateKPIFormat(idx, e.target.value as any)
                        }
                        style={{
                          padding: '0.5rem',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
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
                        backgroundColor: '#ff6b6b',
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

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
            <button
              onClick={() => goToStep('step1')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ccc',
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

      {/* STEP 3: Placeholder (for Hour 4) */}
      {step === 'step3' && (
        <div style={{ border: '1px solid #ddd', padding: '2rem', borderRadius: '8px' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Step 3: Add Charts</h2>
          <p style={{ color: '#666' }}>Coming in Hour 4...</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button
              onClick={() => goToStep('step2')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
