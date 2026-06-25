import { useQuery } from '@tanstack/react-query'
import { getGlobalNetwork } from '@/api/endpoints'

export function useGlobalNetwork() {
  return useQuery({
    queryKey: ['global-network'],
    queryFn: getGlobalNetwork,
    staleTime: 300_000,
  })
}
