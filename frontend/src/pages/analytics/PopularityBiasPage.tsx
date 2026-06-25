import { usePopularityBias } from '@/hooks/useAnalytics'
import { Card, PageTitle, Spinner, EmptyState, InsightPanel } from '@/components/ui/index'
import { PopularityLogLog } from '@/components/charts/PopularityLogLog'
import { useT } from '@/hooks/useT'

const MODEL_COLORS: Record<string, string> = {
  popularity: '#ff6b35',
  als: '#22d3ee',
  content: '#a78bfa',
  hybrid: '#34d399',
}

export function PopularityBiasPage() {
  const t = useT()
  const { data, isLoading } = usePopularityBias()

  const rankPercentile = (rank: number, total: number) =>
    ((1 - rank / total) * 100).toFixed(1)

  return (
    <div>
      <PageTitle
        title={t('page.popularity.title')}
        subtitle={t('page.popularity.subtitle')}
      />

      {isLoading && <div className="flex justify-center py-12"><Spinner size={28} /></div>}

      {data && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#e8e8f0' }}>
              {t('popularity.chart_title')}
            </h3>
            <PopularityLogLog
              playCounts={data.play_counts}
              modelAvgRanks={data.model_avg_ranks}
            />
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(data.model_avg_ranks).map(([model, rank]) => {
              const color = MODEL_COLORS[model] ?? '#888'
              const pct = rankPercentile(rank, data.total_tracks)
              return (
                <Card key={model}>
                  <p className="text-xs font-semibold mb-1" style={{ color }}>{model}</p>
                  <p className="text-2xl font-bold mb-1" style={{ color: '#e8e8f0' }}>
                    #{rank.toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ color: '#6b6b8a' }}>
                    {t('popularity.avg_rank')} · {t('popularity.top_pct').replace('{pct}', pct)}
                  </p>
                  <div className="mt-2 h-1 rounded-full" style={{ background: '#25253a' }}>
                    <div
                      className="h-1 rounded-full transition-all"
                      style={{
                        width: `${100 - Number(pct)}%`,
                        background: color,
                      }}
                    />
                  </div>
                </Card>
              )
            })}
          </div>

          <Card>
            <h4 className="text-xs font-semibold mb-2" style={{ color: '#6b6b8a' }}>
              {t('popularity.section.interpretation')}
            </h4>
            <p className="text-sm" style={{ color: '#e8e8f0' }}>
              The Zipf curve shows that a small fraction of tracks accumulate most listens — a classic
              long-tail distribution. Models with low avg rank (e.g. popularity) concentrate on
              blockbuster hits; models with high avg rank (e.g. content or ALS) surface more obscure
              catalogue, trading popularity for diversity and novelty.
            </p>
            <InsightPanel>
              <span style={{ color: '#e8e8f0' }}>What the rank number means:</span>{' '}
              A lower avg rank = more popular picks. The <span style={{ color: '#a78bfa' }}>content</span> model recommends tracks
              at avg rank ~#4,708 — deep catalog, niche artists few people have heard.
              The <span style={{ color: '#ff6b35' }}>popularity</span> model avg rank ~#960 — near-mainstream chart hits.
              The vertical dashed lines on the curve show exactly where each model sits on the play-count distribution.
            </InsightPanel>
          </Card>
        </div>
      )}

      {!isLoading && !data && (
        <EmptyState message={t('ui.run_pipeline')} />
      )}
    </div>
  )
}
