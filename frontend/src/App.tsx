import React, { useState, useEffect } from 'react'
import { DashboardHome } from './components/DashboardHome'
import { SchemaDebugger } from './components/SchemaDebugger'
import { DashboardBuilder } from './components/DashboardBuilder'
import { QueryMode } from '@/types'
import { useParse } from '@/hooks/useParse'
import { ChartRenderer } from '@/components/ChartRenderer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { logPerformance } from '@/services/performanceMonitor'

type ViewMode = 'home' | 'query' | 'schema' | 'builder' | 'selector'

export const App: React.FC = () => {
  logPerformance('App render')

  const [viewMode, setViewMode] = useState<ViewMode>('home')
  const [mode, setMode] = useState<QueryMode>('quick')
  const [query, setQuery] = useState('')
  const { parse, loading, error, filterSpec, data } = useParse()

  useEffect(() => {
    logPerformance('App mounted')
  }, [])

  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', backgroundColor: '#fafbfc' }}>
        <div style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #ddd',
          padding: '0 2rem',
          display: 'flex',
          gap: '2rem',
        }}>
          <button
            onClick={() => setViewMode('home')}
            style={{
              padding: '1rem 0',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: viewMode === 'home' ? '3px solid #0066cc' : 'none',
              color: viewMode === 'home' ? '#0066cc' : '#666',
              cursor: 'pointer',
              fontWeight: viewMode === 'home' ? '600' : '400',
              fontSize: '1rem',
            }}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setViewMode('query')}
            style={{
              padding: '1rem 0',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: viewMode === 'query' ? '3px solid #0066cc' : 'none',
              color: viewMode === 'query' ? '#0066cc' : '#666',
              cursor: 'pointer',
              fontWeight: viewMode === 'query' ? '600' : '400',
              fontSize: '1rem',
            }}
          >
            🔍 Advanced Query
          </button>
          <button
            onClick={() => setViewMode('schema')}
            style={{
              padding: '1rem 0',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: viewMode === 'schema' ? '3px solid #0066cc' : 'none',
              color: viewMode === 'schema' ? '#0066cc' : '#666',
              cursor: 'pointer',
              fontWeight: viewMode === 'schema' ? '600' : '400',
              fontSize: '1rem',
            }}
          >
            📋 Schema Debugger
          </button>
          <button
            onClick={() => setViewMode('builder')}
            style={{
              padding: '1rem 0',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: viewMode === 'builder' ? '3px solid #0066cc' : 'none',
              color: viewMode === 'builder' ? '#0066cc' : '#666',
              cursor: 'pointer',
              fontWeight: viewMode === 'builder' ? '600' : '400',
              fontSize: '1rem',
            }}
          >
            🎨 Dashboard Builder
          </button>
          <button
            onClick={() => setViewMode('selector')}
            style={{
              padding: '1rem 0',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: viewMode === 'selector' ? '3px solid #0066cc' : 'none',
              color: viewMode === 'selector' ? '#0066cc' : '#666',
              cursor: 'pointer',
              fontWeight: viewMode === 'selector' ? '600' : '400',
              fontSize: '1rem',
            }}
          >
            💾 Saved Dashboards
          </button>		  
        </div>

        {viewMode === 'home' && <DashboardHome />}

        {viewMode === 'query' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍 Advanced Query</h1>
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <label style={{ marginRight: '2rem' }}>
                <input type="radio" value="ai" checked={mode === 'ai'} onChange={(e) => setMode(e.target.value as QueryMode)} />
                {' 🤖 AI Mode'}
              </label>
              <label>
                <input type="radio" value="quick" checked={mode === 'quick'} onChange={(e) => setMode(e.target.value as QueryMode)} />
                {' ⚡ Quick Mode'}
              </label>
            </div>
            <form onSubmit={async (e) => { e.preventDefault(); if (query.trim()) await parse({ query, domain: 'default' }, mode) }}>
              <textarea value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter query" rows={4} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} disabled={loading} />
              <button type="submit" disabled={loading || !query.trim()} style={{ marginTop: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: loading || !query.trim() ? '#ccc' : '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {loading ? '⏳ Processing...' : '🚀 Generate Chart'}
              </button>
            </form>
            {error && <div style={{ color: 'red', marginTop: '1rem' }}>Error: {error}</div>}
            {filterSpec && data.length > 0 && (
              <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', marginTop: '1rem' }}>
                <ChartRenderer spec={filterSpec} data={data} />
              </div>
            )}
          </div>
        )}

        {viewMode === 'schema' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <SchemaDebugger />
          </div>
        )}

        {viewMode === 'builder' && <DashboardBuilder />}
		{viewMode === 'selector' && <DashboardSelector />}
      </div>
    </ErrorBoundary>
  )
}
