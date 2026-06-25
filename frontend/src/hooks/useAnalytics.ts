import { useQuery } from '@tanstack/react-query'
import {
  getCatalogTimeline,
  getCorrelation,
  getCohortTaste,
  getGeography,
  getListeningPatterns,
  getPopularityBias,
  getUserProfile,
} from '@/api/endpoints'

export function useUserProfile(userId: string, model = 'hybrid', n = 10) {
  return useQuery({
    queryKey: ['user-profile', userId, model, n],
    queryFn: () => getUserProfile(userId, model, n),
    enabled: Boolean(userId),
  })
}

export function usePopularityBias() {
  return useQuery({
    queryKey: ['popularity-bias'],
    queryFn: getPopularityBias,
    staleTime: 300_000,
  })
}

export function useCatalogTimeline() {
  return useQuery({
    queryKey: ['catalog-timeline'],
    queryFn: getCatalogTimeline,
    staleTime: 300_000,
  })
}

export function useCorrelation() {
  return useQuery({
    queryKey: ['correlation'],
    queryFn: getCorrelation,
    staleTime: 300_000,
  })
}

export function useListeningPatterns() {
  return useQuery({
    queryKey: ['listening-patterns'],
    queryFn: getListeningPatterns,
    staleTime: 300_000,
  })
}

export function useCohortTaste() {
  return useQuery({
    queryKey: ['cohort-taste'],
    queryFn: getCohortTaste,
    staleTime: 300_000,
  })
}

export function useGeography() {
  return useQuery({
    queryKey: ['geography'],
    queryFn: getGeography,
    staleTime: 300_000,
  })
}
