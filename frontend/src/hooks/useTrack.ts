import { useQuery } from '@tanstack/react-query'
import { getTrack } from '@/api/endpoints'

export function useTrack(trackId: string) {
  return useQuery({
    queryKey: ['track', trackId],
    queryFn: () => getTrack(trackId),
    enabled: Boolean(trackId),
    staleTime: 300_000,
  })
}
