import React from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          margin: '1rem',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c0392b',
        }}>
          <h2>❌ Error Loading Dashboard</h2>
          <p><strong>Error:</strong> {this.state.error?.message}</p>
          <details style={{ marginTop: '1rem' }}>
            <summary>Stack trace:</summary>
            <pre style={{ 
              backgroundColor: '#fff', 
              padding: '1rem',
              overflow: 'auto',
              fontSize: '0.8rem'
            }}>
              {this.state.error?.stack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🔄 Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
