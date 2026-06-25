import { useEvaluation } from '@/hooks/useEvaluation'
import { Card, PageTitle, Skeleton, EmptyState, InsightPanel } from '@/components/ui/index'
import { EvalBarChart } from '@/components/charts/EvalBarChart'
import { useTourAnchor } from '@/hooks/useTourAnchor'
import { useT } from '@/hooks/useT'

const METRIC_LABELS: Record<string, string> = {
  'precision@5': 'P@5', 'recall@5': 'R@5', 'ndcg@5': 'nDCG@5',
  'precision@10': 'P@10', 'recall@10': 'R@10', 'ndcg@10': 'nDCG@10',
  'map@10': 'MAP@10', 'mrr': 'MRR',
  'coverage': 'Coverage', 'novelty': 'Novelty', 'diversity': 'Diversity',
}

const MODEL_META = [
  { key: 'popularity',      color: '#ff6b35' },
  { key: 'item_similarity', color: '#22d3ee' },
  { key: 'als',             color: '#a78bfa' },
  { key: 'content',         color: '#34d399' },
  { key: 'hybrid',          color: '#f59e0b' },
] as const

function EvalSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <Skeleton height={14} width={200} className="mb-4" />
        <div style={{ display: 'flex', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ flex: 1 }}>
              <Skeleton height={10} width={120} className="mb-2" />
              <Skeleton height={180} />
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <Skeleton height={14} width={160} className="mb-4" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 py-2" style={{ borderBottom: '1px solid #25253a' }}>
            <Skeleton height={12} width={80} />
            {[1, 2, 3, 4, 5].map((j) => <Skeleton key={j} height={12} width={48} />)}
          </div>
        ))}
      </Card>
    </div>
  )
}

export function EvaluationPage() {
  const t = useT()
  const { data, isLoading } = useEvaluation()
  useTourAnchor(['eval-chart', 'eval-table'])

  if (isLoading) {
    return (
      <div>
        <PageTitle title={t('page.evaluation.title')} subtitle={t('page.evaluation.subtitle')} />
        <EvalSkeleton />
      </div>
    )
  }

  if (!data || data.error || !data.rows?.length) {
    return (
      <div>
        <PageTitle title={t('page.evaluation.title')} subtitle={t('page.evaluation.subtitle')} />
        <EmptyState message={data?.error ?? t('ui.run_pipeline')} />
      </div>
    )
  }

  const models = [...new Set(data.rows.map((r) => String(r.model)))]
  const metricKeys = Object.keys(data.rows[0] ?? {}).filter((k) => k !== 'model' && k !== 'k')

  // Pivot: one row per model, columns are metrics (at k=10)
  const k10Rows = data.rows.filter((r) => Number(r.k ?? 10) === 10 || !('k' in r))

  // Find best value per metric column (for highlighting)
  const bestPerMetric: Record<string, number> = {}
  metricKeys.forEach((mk) => {
    const vals = k10Rows.map((r) => Number(r[mk] ?? 0)).filter((v) => !isNaN(v))
    bestPerMetric[mk] = Math.max(...vals)
  })

  return (
    <div>
      <PageTitle title={t('page.evaluation.title')} subtitle={t('page.evaluation.subtitle')} />

      <div data-tour-anchor="eval-chart">
        <Card className="mb-6">
          <h2 className="text-sm font-semibold mb-1" style={{ color: '#e8e8f0' }}>
            {t('eval.catalog_quality')}
          </h2>
          <p className="text-xs mb-4" style={{ color: '#6b6b8a' }}>
            Coverage · Novelty · Diversity — 3 metrics computable without ground-truth test set
          </p>
          <EvalBarChart rows={data.rows} />
          <InsightPanel journeyStep={8}>
            <span style={{ color: '#ff6b35', fontWeight: 600 }}>{t('eval.why_zero.title')}</span>{' '}
            {t('eval.why_zero.body')}
          </InsightPanel>
          <InsightPanel collapsible title="Metric glossary">
            <div className="space-y-1.5">
              <div><span style={{ color: '#e8e8f0' }}>Coverage</span> — % of the full catalog the model ever recommends.</div>
              <div><span style={{ color: '#e8e8f0' }}>Novelty</span> — avg log-popularity rank. Higher = more obscure/niche.</div>
              <div><span style={{ color: '#e8e8f0' }}>Diversity</span> — avg pairwise audio distance. Higher = more varied.</div>
              <div><span style={{ color: '#e8e8f0' }}>P@K / nDCG / MAP / MRR</span> — accuracy metrics requiring ground truth (not available).</div>
            </div>
          </InsightPanel>
        </Card>
      </div>

      {/* ── Model Profiles ─────────────────────────────────── */}
      <Card className="mb-6">
        <h2 className="text-sm font-semibold mb-1" style={{ color: '#e8e8f0' }}>
          {t('eval.model_profiles')}
        </h2>
        <p className="text-xs mb-4" style={{ color: '#6b6b8a' }}>
          {t('eval.model_profiles_desc')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {MODEL_META.map(({ key, color }) => (
            <div
              key={key}
              style={{
                background: '#0d0d14',
                border: `1px solid ${color}33`,
                borderLeft: `3px solid ${color}`,
                borderRadius: 8,
                padding: '12px 14px',
              }}
            >
              <div className="font-semibold text-xs mb-1" style={{ color }}>
                {key}
              </div>
              <p className="text-xs mb-2" style={{ color: '#9b9bb8' }}>
                {t(`eval.model.${key}.desc`)}
              </p>
              <div className="text-xs space-y-1">
                <div style={{ color: '#6bffa0' }}>
                  ✓ {t(`eval.model.${key}.strength`)}
                </div>
                <div style={{ color: '#ff8080' }}>
                  ✗ {t(`eval.model.${key}.weakness`)}
                </div>
                <div style={{ color: '#6b6b8a', marginTop: 4 }}>
                  {t(`eval.model.${key}.coverage_note`)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
          {(['coverage', 'novelty', 'diversity'] as const).map((m) => (
            <div key={m} style={{ background: '#0d0d14', borderRadius: 6, padding: '8px 10px', border: '1px solid #25253a' }}>
              <div className="text-xs font-medium mb-1" style={{ color: '#e8e8f0' }}>{m}</div>
              <div className="text-xs" style={{ color: '#6b6b8a' }}>{t(`eval.metric.${m}.what`)}</div>
            </div>
          ))}
        </div>
      </Card>

      <div data-tour-anchor="eval-table">
        <Card>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#e8e8f0' }}>{t('eval.raw_table')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid #25253a' }}>
                  <th className="text-left py-2 pr-4" style={{ color: '#6b6b8a' }}>Model</th>
                  {metricKeys.map((k) => (
                    <th key={k} className="text-right py-2 px-2 whitespace-nowrap" style={{ color: '#6b6b8a' }}>
                      {METRIC_LABELS[k] ?? k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {k10Rows.map((row, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: '1px solid #25253a' }}
                  >
                    <td className="py-2 pr-4 font-medium" style={{ color: '#ff6b35' }}>
                      {String(row.model)}
                    </td>
                    {metricKeys.map((k) => {
                      const val = typeof row[k] === 'number' ? (row[k] as number) : NaN
                      const isBest = !isNaN(val) && val > 0 && Math.abs(val - bestPerMetric[k]!) < 1e-9
                      return (
                        <td
                          key={k}
                          className="text-right py-2 px-2 tabular-nums"
                          style={{
                            color: isBest ? '#ff6b35' : '#e8e8f0',
                            fontWeight: isBest ? 700 : 400,
                          }}
                        >
                          {isBest && <span style={{ marginRight: 2 }}>★</span>}
                          {typeof row[k] === 'number' ? (row[k] as number).toFixed(4) : String(row[k] ?? '—')}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {models.length > 0 && (
            <p className="text-xs mt-3" style={{ color: '#6b6b8a' }}>
              {models.length} {t('eval.models_evaluated')} · {t('eval.train_test')}
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
