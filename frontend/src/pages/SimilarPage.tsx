import { useState } from 'react'
import { useTracks } from '@/hooks/useTracks'
import { useSimilarTracks } from '@/hooks/useSimilarTracks'
import { useTrack } from '@/hooks/useTrack'
import { Card, PageTitle, Select, Spinner, EmptyState, ScoreBar, Badge, AudioFeatureBars } from '@/components/ui/index'
import { AudioRadar } from '@/components/track/AudioRadar'
import { useT } from '@/hooks/useT'
import { fmtDuration, genreColor } from '@/lib/utils'
import type { ModelName } from '@/types/api'

const MODELS: ModelName[] = ['item_similarity', 'content', 'als', 'hybrid']

export function SimilarPage() {
  const t = useT()
  const { data: trackList, isLoading: loadingTracks } = useTracks(1, 100)
  const [trackId, setTrackId] = useState('')
  const [model, setModel] = useState<ModelName>('item_similarity')
  const { data: similar, isLoading: loadingSim } = useSimilarTracks(trackId, model, 10)
  const { data: trackDetail } = useTrack(trackId)

  return (
    <div>
      <PageTitle title={t('page.similar.title')} subtitle={t('page.similar.subtitle')} />

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: '#6b6b8a' }}>{t('similar.seed_track')}</label>
            {loadingTracks ? (
              <Spinner size={16} />
            ) : (
              <Select value={trackId} onChange={(e) => setTrackId(e.target.value)} className="w-full">
                <option value="">— {t('similar.select_seed')} —</option>
                {trackList?.tracks.map((tr) => (
                  <option key={tr.track_id} value={tr.track_id}>
                    {tr.title} · {tr.genre ?? '?'}
                  </option>
                ))}
              </Select>
            )}
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: '#6b6b8a' }}>{t('rec.model_label')}</label>
            <Select value={model} onChange={(e) => setModel(e.target.value as ModelName)} className="w-full">
              {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
        </div>
      </Card>

      {trackId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seed track details */}
          {trackDetail && (
            <Card>
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#e8e8f0' }}>{trackDetail.title}</h3>
              <p className="text-xs mb-4" style={{ color: '#6b6b8a' }}>
                {trackDetail.artist_name} · {fmtDuration(trackDetail.duration_ms)}
              </p>
              {trackDetail.genre && (
                <div className="mb-4">
                  <Badge color={genreColor(trackDetail.genre)}>{trackDetail.genre}</Badge>
                </div>
              )}
              <AudioRadar track={trackDetail} />
              {trackDetail.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {trackDetail.tags.slice(0, 8).map((tag) => (
                    <Badge key={tag} color="#6b6b8a">{tag}</Badge>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Similar tracks */}
          <div className="lg:col-span-2">
            {loadingSim ? (
              <div className="flex justify-center py-12"><Spinner size={28} /></div>
            ) : similar && similar.similar.length > 0 ? (
              <div className="space-y-2">
                {similar.similar.map((r, i) => (
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
                    <div className="w-28 shrink-0">
                      <ScoreBar score={r.score} />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState message={t('similar.no_results')} />
            )}
          </div>
        </div>
      )}

      {!trackId && <EmptyState message={t('similar.no_selection')} />}
    </div>
  )
}
