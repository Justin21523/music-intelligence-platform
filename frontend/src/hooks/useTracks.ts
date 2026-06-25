import { useQuery } from '@tanstack/react-query'
import { listTracks } from '@/api/endpoints'

export function useTracks(page = 1, pageSize = 20, genre?: string) {
  return useQuery({
    queryKey: ['tracks', page, pageSize, genre],
    queryFn: () => listTracks(page, pageSize, genre),
    staleTime: 60_000,
  })
}
