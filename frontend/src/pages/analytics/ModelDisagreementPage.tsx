import { useState, useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useUsers } from '@/hooks/useRecommendations'
import { getRecommendations } from '@/api/endpoints'
import { Card, PageTitle, Select, Spinner, EmptyState, Badge, InsightPanel } from '@/components/ui/index'
import { useT } from '@/hooks/useT'
import { OverlapHeatmap } from '@/components/charts/OverlapHeatmap'
import type { ModelName } from '@/types/api'

const MODELS: ModelName[] = ['popularity', 'als', 'content', 'hybrid']

export function ModelDisagreementPage() {
  const t = useT()
  const { data: users, isLoading: loadingUsers } = useUsers()
  const [userId, setUserId] = useState('U0001')

  const results = useQueries({
    queries: MODELS.map((m) => ({
      queryKey: ['recs', userId, m, 10],
      queryFn: () => getRecommendations(userId, m, 10),
      enabled: Boolean(userId),
    })),
  })

  const isLoading = results.some((r) => r.isLoading)

  // Compute 4×4 overlap matrix (Jaccard-style: intersection / 10)
  const { matrix, mostUnique, mostSimilarPair } = useMemo(() => {
    const trackSets = results.map((r) =>
      new Set(r.data?.recommendations.map((t) => t.track_id) ?? [])
    )

    const mat: number[][] = MODELS.map((_, i) =>
      MODELS.map((_, j) => {
        const a = trackSets[i]
        const b = trackSets[j]
        if (!a.size || !b.size) return i === j ? 1 : 0
        let overlap = 0
        a.forEach((id) => { if (b.has(id)) overlap++ })
        return overlap / 10
      })
    )

    // Most unique: lowest avg overlap (excluding diagonal)
    const avgOverlaps = MODELS.map((_, i) =>
      MODELS.reduce((s, _, j) => i !== j ? s + (mat[i][j] ?? 0) : s, 0) / (MODELS.length - 1)
    )
    const mostUnique = MODELS[avgOverlaps.indexOf(Math.min(...avgOverlaps))]

    // Most similar pair: highest off-diagonal value
    let maxOverlap = 0; let pairA = ''; let pairB = ''
    MODELS.forEach((m1, i) => {
      MODELS.forEach((m2, j) => {
        if (i < j && (mat[i][j] ?? 0) > maxOverlap) {
          maxOverlap = mat[i][j]
          pairA = m1; pairB = m2
        }
      })
    })

    return { matrix: mat, mostUnique, mostSimilarPair: { pairA, pairB, overlap: maxOverlap } }
  }, [results])

  return (
    <div>
      <PageTitle
        title={t('page.disagreement.title')}
        subtitle={t('page.disagreement.subtitle')}
      />

      <Card className="mb-6">
        <label className="block text-xs mb-1.5" style={{ color: '#6b6b8a' }}>User</label>
        {loadingUsers ? <Spinner size={16} /> : (
          <Select value={userId} onChange={(e) => setUserId(e.target.value)} className="w-64">
            {users?.users.map((u) => (
              <option key={u.user_id} value={u.user_id}>{u.user_id} · {u.username}</option>
            ))}
          </Select>
        )}
      </Card>

      {isLoading && <div className="flex justify-center py-12"><Spinner size={28} /></div>}

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <h3 className="text-sm font-semibold mb-6" style={{ color: '#e8e8f0' }}>
                Recommendation Overlap (% shared tracks out of top-10)
              </h3>
              <OverlapHeatmap matrix={matrix} models={[...MODELS]} />
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <h4 className="text-xs font-semibold mb-3" style={{ color: '#6b6b8a' }}>INSIGHTS</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-xs" style={{ color: '#6b6b8a' }}>Most unique model</p>
                  <Badge color="#22d3ee">{mostUnique}</Badge>
                  <p className="text-xs mt-1" style={{ color: '#6b6b8a' }}>
                    Lowest average overlap with other models
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#6b6b8a' }}>Most similar pair</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <Badge color="#ff6b35">{mostSimilarPair.pairA}</Badge>
                    <Badge color="#ff6b35">{mostSimilarPair.pairB}</Badge>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#6b6b8a' }}>
                    {Math.round(mostSimilarPair.overlap * 100)}% shared recommendations
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <p className="text-xs" style={{ color: '#6b6b8a' }}>
                <span style={{ color: '#22d3ee' }}>Cyan diagonal</span> = 100% self-overlap.
              </p>
              <p className="text-xs mt-1" style={{ color: '#6b6b8a' }}>
                Higher orange intensity = more shared recommendations between models.
              </p>
              <p className="text-xs mt-1" style={{ color: '#6b6b8a' }}>
                Models with low mutual overlap = more diverse ensemble potential.
              </p>
              <InsightPanel journeyStep={4}>
                Each cell shows how many tracks appear in <span style={{ color: '#e8e8f0' }}>both</span> models' top-10 for this user.
                Low overlap (dark cell) = the models strongly disagree — each brings unique recommendations.
                <span style={{ color: '#22d3ee' }}> als</span> vs <span style={{ color: '#a78bfa' }}>content</span> typically shows the
                highest disagreement: one uses collaborative signals, the other pure audio features.
                Low disagreement models are less useful to combine — they'd just duplicate the same tracks.
              </InsightPanel>
            </Card>
          </div>
        </div>
      )}

      {!isLoading && results.every((r) => !r.data) && (
        <EmptyState message="No recommendations returned — ensure the API is running" />
      )}
    </div>
  )
}
