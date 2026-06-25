import { useQuery } from '@tanstack/react-query'
import { getArtistNetwork, listArtists } from '@/api/endpoints'

export function useArtistNetwork(artistId: string, depth = 1) {
  return useQuery({
    queryKey: ['artistNetwork', artistId, depth],
    queryFn: () => getArtistNetwork(artistId, depth),
    enabled: Boolean(artistId),
    staleTime: 60_000,
  })
}

export function useArtistList() {
  return useQuery({
    queryKey: ['artistList'],
    queryFn: () => listArtists(200),
    staleTime: 300_000,
  })
}
