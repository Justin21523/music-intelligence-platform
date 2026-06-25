import { useRecommendations, useUsers } from '@/hooks/useRecommendations'
import { useUIStore } from '@/store/uiStore'
import { Card, PageTitle, Select, Skeleton, EmptyState, ScoreBar, Badge, AudioFeatureBars } from '@/components/ui/index'
import { genreColor } from '@/lib/utils'
import type { ModelName } from '@/types/api'
import { useTourAnchor } from '@/hooks/useTourAnchor'
import { useT } from '@/hooks/useT'

const MODELS: ModelName[] = ['popularity', 'als', 'content', 'hybrid']

function RecSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="flex items-center gap-4 py-3">
          <Skeleton width={20} height={12} />
          <div className="flex-1 space-y-1.5">
            <Skeleton height={13} width="60%" />
            <Skeleton height={10} width="35%" />
          </div>
          <Skeleton width={48} height={20} />
          <Skeleton width={128} height={10} />
        </Card>
      ))}
    </div>
  )
}

export function RecommendPage() {
  const t = useT()
  const { selectedUserId, setSelectedUserId, selectedModel, setSelectedModel } = useUIStore()
  const { data: users, isLoading: loadingUsers } = useUsers()
  const { data: recs, isLoading: loadingRecs } = useRecommendations(
    selectedUserId, selectedModel as ModelName, 10
  )
  useTourAnchor(['rec-list'])

  return (
    <div>
      <PageTitle title={t('page.recommend.title')} subtitle={t('page.recommend.subtitle')} />

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: '#6b6b8a' }}>{t('rec.user_label')}</label>
            {loadingUsers ? <Skeleton height={36} /> : (
              <Select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full"
              >
                {users?.users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.user_id} · {u.username}
                  </option>
                ))}
              </Select>
            )}
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: '#6b6b8a' }}>{t('rec.model_label')}</label>
            <Select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as ModelName)}
              className="w-full"
            >
              {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
        </div>
      </Card>

      {loadingRecs ? (
        <RecSkeleton />
      ) : recs && recs.recommendations.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs" style={{ color: '#6b6b8a' }}>
              {recs.recommendations.length} {t('rec.count')} · model:
            </span>
            <span className="text-xs font-semibold" style={{ color: '#ff6b35' }}>{recs.model}</span>
          </div>
          <div data-tour-anchor="rec-list" className="space-y-2">
            {recs.recommendations.map((r, i) => (
              <Card key={r.track_id} className="flex items-center gap-4 py-3">
                <span className="text-xs w-5 text-right font-mono" style={{ color: '#6b6b8a' }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: '#e8e8f0' }}>
                    {r.title ?? r.track_id}
                  </div>
                  <div className="text-xs truncate" style={{ color: '#6b6b8a' }}>
                    {r.artist_name ?? '—'}
                  </div>
                  <AudioFeatureBars
                    energy={r.energy}
                    danceability={r.danceability}
                    valence={r.valence}
                  />
                </div>
                {r.genre && <Badge color={genreColor(r.genre)}>{r.genre}</Badge>}
                <div className="w-32 shrink-0">
                  <ScoreBar score={r.score} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState message={t('ui.no_data')} />
      )}
    </div>
  )
}
