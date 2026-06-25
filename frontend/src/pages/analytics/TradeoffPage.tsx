import { useEvaluation } from '@/hooks/useEvaluation'
import { Card, PageTitle, Spinner, EmptyState, InsightPanel } from '@/components/ui/index'
import { useT } from '@/hooks/useT'
import { TradeoffBubble } from '@/components/charts/TradeoffBubble'
import type { EvalRow } from '@/types/api'

function InsightCard({ model, row, color }: { model: string; row: EvalRow; color: string }) {
  return (
    <Card>
      <p className="text-xs font-semibold mb-2" style={{ color }}>{model}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span style={{ color: '#6b6b8a' }}>Precision@10</span>
          <span style={{ color: '#e8e8f0' }}>{Number(row['precision@10'] ?? 0).toFixed(3)}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: '#6b6b8a' }}>Novelty</span>
          <span style={{ color: '#e8e8f0' }}>{Number(row.novelty ?? 0).toFixed(1)}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: '#6b6b8a' }}>Coverage</span>
          <span style={{ color: '#e8e8f0' }}>{(Number(row.coverage ?? 0) * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: '#6b6b8a' }}>Diversity</span>
          <span style={{ color: '#e8e8f0' }}>{Number(row.diversity ?? 0).toFixed(3)}</span>
        </div>
      </div>
    </Card>
  )
}

const MODEL_COLORS: Record<string, string> = {
  popularity: '#ff6b35',
  item_similarity: '#f7c59f',
  als: '#22d3ee',
  content: '#a78bfa',
  hybrid: '#34d399',
}

export function TradeoffPage() {
  const t = useT()
  const { data, isLoading } = useEvaluation()

  return (
    <div>
      <PageTitle
        title={t('page.tradeoff.title')}
        subtitle={t('page.tradeoff.subtitle')}
      />

      {isLoading && <div className="flex justify-center py-12"><Spinner size={28} /></div>}

      {data && data.rows.length > 0 ? (
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#e8e8f0' }}>
              Novelty × Diversity × Coverage Bubble Chart
            </h3>
            <p className="text-xs mb-4" style={{ color: '#6b6b8a' }}>
              X = Novelty (higher = more obscure picks) · Y = Diversity (higher = more varied list) ·
              Bubble size = Catalog Coverage (% of 10K tracks used)
            </p>
            <TradeoffBubble rows={data.rows} />
            <InsightPanel journeyStep={4}>
              <span style={{ color: '#f7c59f', fontWeight: 600 }}>item_similarity</span> has the largest bubble — it covers{' '}
              18.8% of the catalog, the broadest discovery of any model.{' '}
              <span style={{ color: '#a78bfa', fontWeight: 600 }}>content</span> scores highest novelty (18.1) but lowest diversity
              (0.034) — finds niche tracks, but they all sound similar.{' '}
              <span style={{ color: '#22d3ee', fontWeight: 600 }}>als</span> recommends mainstream tracks (novelty 8.1) with high
              within-list variety — safe but diverse.{' '}
              <span style={{ color: '#34d399', fontWeight: 600 }}>hybrid</span> sits in the center — balanced across all three dimensions.
            </InsightPanel>
            <InsightPanel collapsible title="What each axis means">
              <div className="space-y-1.5">
                <div><span style={{ color: '#e8e8f0' }}>Novelty</span> — avg log-rank of recommended tracks in the global popularity list. High novelty = deep catalog, niche tracks. Low = mainstream hits.</div>
                <div><span style={{ color: '#e8e8f0' }}>Diversity</span> — avg pairwise audio distance between tracks in a single recommendation list. High = varied genres/moods. Low = repetitive sound.</div>
                <div><span style={{ color: '#e8e8f0' }}>Coverage (bubble size)</span> — fraction of the 10K catalog the model has ever recommended. Larger = wider discovery range.</div>
                <div className="pt-1" style={{ borderTop: '1px solid #25253a' }}><span style={{ color: '#e8e8f0' }}>Ideal model</span> depends on use case: discovery → large bubble + high novelty; listening session → high diversity; mainstream → low novelty.</div>
              </div>
            </InsightPanel>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {data.rows.map((row) => (
              <InsightCard
                key={row.model}
                model={row.model}
                row={row}
                color={MODEL_COLORS[row.model] ?? '#888'}
              />
            ))}
          </div>

          <Card>
            <h4 className="text-xs font-semibold mb-2" style={{ color: '#6b6b8a' }}>READING THE CHART</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs" style={{ color: '#6b6b8a' }}>
              <div>
                <span style={{ color: '#a78bfa' }}>Top-right (high novelty + diversity):</span>
                {' '}Recommends niche tracks with a varied, exploratory list — ideal for discovery.
              </div>
              <div>
                <span style={{ color: '#22d3ee' }}>Bottom-left (low novelty + diversity):</span>
                {' '}Mainstream picks that all sound similar — safe but repetitive.
              </div>
              <div>
                <span style={{ color: '#ff6b35' }}>Top-left (low novelty, high diversity):</span>
                {' '}Popular tracks but with varied styles — broad safe playlist.
              </div>
              <div>
                <span style={{ color: '#6b6b8a' }}>Bubble size = Coverage:</span>
                {' '}Larger bubble = the model uses more of the 10K catalog.
              </div>
            </div>
          </Card>
        </div>
      ) : (
        !isLoading && (
          <EmptyState message="No evaluation data — run 'make evaluate' first, then restart the API" />
        )
      )}
    </div>
  )
}
