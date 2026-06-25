import { useQuery } from '@tanstack/react-query'
import { getPipelineStatus } from '@/api/endpoints'

export function usePipelineStatus() {
  return useQuery({
    queryKey: ['pipeline-status'],
    queryFn: getPipelineStatus,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'running' ? 1000 : false
    },
    staleTime: 0,
  })
}
