import { useQuery } from '@tanstack/react-query'
import { searchTracks } from '@/api/endpoints'
import type { SearchMode } from '@/types/api'

export function useSearch(q: string, mode: SearchMode, limit = 20) {
  return useQuery({
    queryKey: ['search', q, mode, limit],
    queryFn: () => searchTracks(q, mode, limit),
    enabled: q.trim().length > 0,
    staleTime: 30_000,
  })
}
