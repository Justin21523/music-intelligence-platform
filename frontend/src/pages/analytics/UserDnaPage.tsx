import { useState } from 'react'
import { useUsers } from '@/hooks/useRecommendations'
import { useUserProfile } from '@/hooks/useAnalytics'
import { Card, PageTitle, Select, Spinner, EmptyState, Badge, InsightPanel } from '@/components/ui/index'
import { useT } from '@/hooks/useT'
import { UserDnaRadar } from '@/components/charts/UserDnaRadar'
import type { ModelName } from '@/types/api'

const MODELS: ModelName[] = ['popularity', 'als', 'content', 'hybrid']

function pctDelta(a: number, b: number): string {
  const d = Math.round((b - a) * 100)
  return d >= 0 ? `+${d}%` : `${d}%`
}

export function UserDnaPage() {
  const t = useT()
  const { data: users, isLoading: loadingUsers } = useUsers()
  const [userId, setUserId] = useState('U0001')
  const [model, setModel] = useState<ModelName>('hybrid')

  const { data, isLoading } = useUserProfile(userId, model)

  return (
    <div>
      <PageTitle
        title={t('page.dna.title')}
        subtitle={t('page.dna.subtitle')}
      />

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: '#6b6b8a' }}>User</label>
            {loadingUsers ? <Spinner size={16} /> : (
              <Select value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full">
                {users?.users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>{u.user_id} · {u.username}</option>
                ))}
              </Select>
            )}
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: '#6b6b8a' }}>Model</label>
            <Select value={model} onChange={(e) => setModel(e.target.value as ModelName)} className="w-full">
              {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
        </div>
      </Card>

      {isLoading && <div className="flex justify-center py-12"><Spinner size={28} /></div>}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Radar chart */}
          <div className="lg:col-span-2">
            <Card>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#e8e8f0' }}>
                Audio Feature Profile
              </h3>
              <UserDnaRadar
                listenProfile={data.listen_profile}
                recProfile={data.rec_profile}
                model={data.model}
              />
            </Card>
          </div>

          {/* Stats sidebar */}
          <div className="space-y-4">
            <Card>
              <h4 className="text-xs font-semibold mb-3" style={{ color: '#6b6b8a' }}>PROFILE STATS</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#6b6b8a' }}>Listens analysed</span>
                  <span style={{ color: '#e8e8f0' }}>{data.listen_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#6b6b8a' }}>Recs returned</span>
                  <span style={{ color: '#e8e8f0' }}>{data.rec_track_count}</span>
                </div>
              </div>
            </Card>

            <Card>
              <h4 className="text-xs font-semibold mb-3" style={{ color: '#6b6b8a' }}>PROFILE DELTA (rec − listen)</h4>
              <div className="space-y-2">
                {(
                  [
                    ['Energy', data.listen_profile.energy, data.rec_profile.energy],
                    ['Dance', data.listen_profile.danceability, data.rec_profile.danceability],
                    ['Valence', data.listen_profile.valence, data.rec_profile.valence],
                    ['Acoustic', data.listen_profile.acousticness, data.rec_profile.acousticness],
                    ['Tempo', data.listen_profile.tempo_norm, data.rec_profile.tempo_norm],
                  ] as [string, number, number][]
                ).map(([label, a, b]) => {
                  const d = Math.round((b - a) * 100)
                  const color = d > 5 ? '#22d3ee' : d < -5 ? '#ff6b35' : '#6b6b8a'
                  return (
                    <div key={label} className="flex justify-between text-sm items-center">
                      <span style={{ color: '#6b6b8a' }}>{label}</span>
                      <Badge color={color}>{pctDelta(a, b)}</Badge>
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card>
              <p className="text-xs" style={{ color: '#6b6b8a' }}>
                <span style={{ color: '#ff6b35' }}>●</span> Orange = your actual listening taste
              </p>
              <p className="text-xs mt-1" style={{ color: '#6b6b8a' }}>
                <span style={{ color: '#22d3ee' }}>●</span> Cyan = {model} recommendations
              </p>
              <p className="text-xs mt-2" style={{ color: '#6b6b8a' }}>
                Closer shapes = model captures your taste better.
              </p>
              <InsightPanel journeyStep={4}>
                <span style={{ color: '#e8e8f0' }}>How to read the chart:</span>{' '}
                Overlapping polygons mean the model recommends tracks similar to what you already listen to.
                A gap on <span style={{ color: '#e8e8f0' }}>Valence</span> means the model skews happier or sadder than your history.
                A gap on <span style={{ color: '#e8e8f0' }}>Energy</span> means recs are more intense or mellow than your taste.
                Perfect overlap across all axes = the model fully captures your audio profile.
              </InsightPanel>
            </Card>
          </div>
        </div>
      )}

      {!isLoading && !data && userId && (
        <EmptyState message="No data returned — ensure the API is running and user has listen history" />
      )}
    </div>
  )
}
