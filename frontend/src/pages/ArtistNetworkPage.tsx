import { useGlobalNetwork } from '@/hooks/useGlobalNetwork'
import { useTourAnchor } from '@/hooks/useTourAnchor'
import { Card, EmptyState, PageTitle, Skeleton } from '@/components/ui/index'
import { NetworkGraph, COMMUNITY_COLORS } from '@/components/charts/NetworkGraph'
import { useT } from '@/hooks/useT'

function NetworkSkeleton() {
  return (
    <div className="flex gap-5">
      <div style={{ width: 280, flexShrink: 0 }} className="space-y-4">
        <Card>
          <Skeleton height={12} width={100} className="mb-3" />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex justify-between py-1.5">
              <Skeleton height={10} width={80} />
              <Skeleton height={10} width={40} />
            </div>
          ))}
        </Card>
        <Card>
          <Skeleton height={12} width={100} className="mb-3" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between py-1.5">
              <Skeleton height={10} width={110} />
              <Skeleton height={10} width={32} />
            </div>
          ))}
        </Card>
        <Card>
          <Skeleton height={12} width={80} className="mb-3" />
          {[1, 2, 3].map((i) => <Skeleton key={i} height={12} width="90%" className="mb-2" />)}
        </Card>
      </div>
      <div className="flex-1" style={{ height: 600, borderRadius: 8, overflow: 'hidden' }}>
        <Skeleton width="100%" height="100%" />
      </div>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: '#6b6b8a' }}>{label}</span>
      <span style={{ color: '#e8e8f0', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}

export function ArtistNetworkPage() {
  const t = useT()
  useTourAnchor(['network-graph', 'sna-stats'])
  const { data, isLoading } = useGlobalNetwork()

  return (
    <div>
      <PageTitle
        title={t('page.artists.title')}
        subtitle={t('page.artists.subtitle')}
      />

      {isLoading && <NetworkSkeleton />}

      {!isLoading && !data && (
        <EmptyState message={t('ui.run_pipeline')} />
      )}

      {data && (
        <div className="flex gap-5">
          {/* ── Left panel: SNA stats ───────────────────────────── */}
          <div style={{ width: 280, flexShrink: 0 }} data-tour-anchor="sna-stats">
            <Card className="mb-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#e8e8f0' }}>
                {t('network.stats')}
              </h3>
              <div className="space-y-2 text-sm">
                <StatRow label={t('network.nodes')} value={String(data.stats.n_nodes)} />
                <StatRow label={t('network.edges')} value={String(data.stats.n_edges)} />
                <StatRow label={t('network.communities')} value={String(data.stats.n_communities)} />
                <StatRow label={t('network.avg_clustering')} value={data.stats.avg_clustering.toFixed(3)} />
                <StatRow label={t('network.avg_degree')} value={data.stats.avg_degree.toFixed(1)} />
                <StatRow label={t('network.threshold')} value={data.stats.threshold.toFixed(3)} />
              </div>
            </Card>

            <Card className="mb-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#e8e8f0' }}>
                {t('network.top_hubs')}
              </h3>
              <div className="space-y-2">
                {data.stats.top_hubs.slice(0, 5).map((hub, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span style={{ color: '#e8e8f0' }}>{hub.name}</span>
                    <span style={{ color: '#ff6b35' }}>
                      {(hub.betweenness * 100).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#e8e8f0' }}>
                {t('network.communities_label')}
              </h3>
              <div className="space-y-2.5 overflow-y-auto" style={{ maxHeight: 320 }}>
                {data.communities.map((c) => (
                  <div key={c.id} className="flex items-start gap-2 text-xs">
                    <span
                      className="flex-shrink-0 rounded-full mt-0.5"
                      style={{
                        width: 10,
                        height: 10,
                        background: COMMUNITY_COLORS[c.id % COMMUNITY_COLORS.length],
                      }}
                    />
                    <div>
                      <div style={{ color: '#e8e8f0' }}>Community {c.id}</div>
                      <div style={{ color: '#6b6b8a' }}>
                        {c.size} {t('network.artists')} · {t('network.led_by')}: {c.top_artist}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Right panel: force-directed graph ───────────────── */}
          <div className="flex-1" style={{ minWidth: 0 }} data-tour-anchor="network-graph">
            <div
              style={{
                height: 600,
                borderRadius: 8,
                border: '1px solid #25253a',
                background: '#0d0d14',
                overflow: 'hidden',
              }}
            >
              <NetworkGraph nodes={data.nodes} edges={data.edges} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
