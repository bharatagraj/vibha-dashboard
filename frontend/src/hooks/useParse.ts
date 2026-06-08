import { useState, useCallback } from 'react'
import { FilterSpec, ParseRequest, DirectQueryRequest, QueryMode } from '@/types'
import { mockApiCall, getMockChartData } from '@/services/mockApi'

export const useParse = () => {
  const [state, setState] = useState({
    mode: 'ai' as QueryMode,
    loading: false,
    error: null as string | null,
    filterSpec: null as FilterSpec | null,
    data: [] as Record<string, unknown>[],
  })

  const parse = useCallback(async (input: any, mode: QueryMode) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Use mock API for now
      const response = await mockApiCall('', input, mode)
      const filterSpec = response.filterSpec
      const data = getMockChartData(filterSpec.chartType)

      setState(prev => ({
        ...prev,
        loading: false,
        filterSpec,
        data,
        mode,
      }))

      return filterSpec
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      setState(prev => ({ ...prev, loading: false, error }))
      return null
    }
  }, [])

  return { ...state, parse }
}
