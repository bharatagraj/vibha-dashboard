import { FilterSpec } from '@/types'

export interface DirectQueryRequest {
  table: string
  domain: string
  columns: string[]
  groupBy?: string[]
  filters?: Record<string, any>
}

export interface DirectQueryResponse {
  filterSpec: FilterSpec
  data: Record<string, unknown>[]
  kpiValues?: Record<string, number>
  executionTimeMs: number
}

const API_BASE = 'http://localhost:8000/api/v1'

export const queryDashboardData = async (
  request: DirectQueryRequest
): Promise<DirectQueryResponse> => {
  try {
    const response = await fetch(`${API_BASE}/direct-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ Backend response:', data)
    return data
  } catch (error) {
    console.error('❌ Backend query failed:', error)
    throw error
  }
}

export const getTableSchema = async (table: string, domain: string) => {
  try {
    const response = await fetch(`${API_BASE}/schema/${domain}/${table}`)
    if (!response.ok) throw new Error('Failed to fetch schema')
    return await response.json()
  } catch (error) {
    console.error('Schema fetch failed:', error)
    return null
  }
}
