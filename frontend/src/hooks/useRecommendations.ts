import { useQuery } from '@tanstack/react-query'
import { getRecommendations, listUsers } from '@/api/endpoints'
import type { ModelName } from '@/types/api'

export function useRecommendations(userId: string, model: ModelName = 'hybrid', n = 10) {
  return useQuery({
    queryKey: ['recommendations', userId, model, n],
    queryFn: () => getRecommendations(userId, model, n),
    enabled: Boolean(userId),
    staleTime: 30_000,
  })
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(200),
    staleTime: 300_000,
  })
}
