import { useQuery } from '@tanstack/react-query'
import { getEvaluation } from '@/api/endpoints'

export function useEvaluation() {
  return useQuery({ queryKey: ['evaluation'], queryFn: getEvaluation, staleTime: 300_000 })
}
