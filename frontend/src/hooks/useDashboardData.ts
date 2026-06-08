import { useState, useCallback } from 'react'
import { queryDashboardData, DirectQueryRequest, DirectQueryResponse } from '@/services/dashboardApi'
import { getMockChartData } from '@/services/mockApi'

interface UseDashboardDataState {
  loading: boolean
  error: string | null
  data: Record<string, unknown>[]
  kpiValues: Record<string, number>
  executionTime: number
}

export const useDashboardData = () => {
  const [state, setState] = useState<UseDashboardDataState>({
    loading: false,
    error: null,
    data: [],
    kpiValues: {},
    executionTime: 0,
  })

  const fetchData = useCallback(async (request: DirectQueryRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await queryDashboardData(request)
      setState({
        loading: false,
        error: null,
        data: response.data,
        kpiValues: response.kpiValues || {},
        executionTime: response.executionTimeMs,
      })
      return response
    } catch (error) {
      console.error('Failed to fetch data:', error)
      // Fallback to mock data
      const mockData = getMockChartData(request.columns[0] || 'bar')
      setState({
        loading: false,
        error: `Backend unavailable, using mock data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: mockData,
        kpiValues: {},
        executionTime: 0,
      })
    }
  }, [])

  return { ...state, fetchData }
}
