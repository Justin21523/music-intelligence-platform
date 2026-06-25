import { useQuery } from '@tanstack/react-query'
import { getSimilarTracks } from '@/api/endpoints'
import type { ModelName } from '@/types/api'

export function useSimilarTracks(trackId: string, model: ModelName = 'item_similarity', n = 10) {
  return useQuery({
    queryKey: ['similar', trackId, model, n],
    queryFn: () => getSimilarTracks(trackId, model, n),
    enabled: Boolean(trackId),
    staleTime: 60_000,
  })
}
