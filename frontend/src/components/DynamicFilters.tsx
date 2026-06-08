import React from 'react'
import { FilterConfig } from '@/types/dashboard'

interface DynamicFiltersProps {
  filters: FilterConfig[]
  values: Record<string, any>
  onChange: (filterId: string, value: any) => void
}

export const DynamicFilters: React.FC<DynamicFiltersProps> = ({
  filters,
  values,
  onChange,
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem',
      padding: '1rem',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
    }}>
      {filters.map((filter) => (
        <div key={filter.id}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            {filter.label}
          </label>
          {filter.type === 'select' && (
            <select
              value={values[filter.id] || ''}
              onChange={(e) => onChange(filter.id, e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <option value="">All</option>
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
            </select>
          )}
          {filter.type === 'date' && (
            <input
              type="date"
              value={values[filter.id] || ''}
              onChange={(e) => onChange(filter.id, e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
