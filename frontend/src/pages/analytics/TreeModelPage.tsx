import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, PageTitle, Skeleton, EmptyState, InsightPanel } from '@/components/ui/index'
import { useT } from '@/hooks/useT'
import { seqColor, rankColor } from '@/utils/colorScale'
import { apiFetch } from '@/api/client'

// ── Feature & Genre colour palettes ──────────────────────────────────────────
const FEATURE_COLORS: Record<string, string> = {
  energy:           '#ff6b35',
  danceability:     '#22d3ee',
  valence:          '#a78bfa',
  acousticness:     '#34d399',
  tempo:            '#f59e0b',
  instrumentalness: '#f472b6',
  loudness:         '#60a5fa',
  speechiness:      '#4ade80',
  liveness:         '#fb923c',
}

const GENRE_COLORS: Record<string, string> = {
  Rock:        '#ef4444', Pop:         '#ec4899', Jazz:      '#3b82f6',
  Classical:   '#a78bfa', Electronic:  '#22d3ee', 'Hip-Hop': '#f59e0b',
  'R&B':       '#f97316', Country:     '#84cc16', Folk:      '#14b8a6',
  Metal:       '#6366f1', Indie:       '#d946ef', Blues:     '#0ea5e9',
  Ambient:     '#94a3b8', Reggae:      '#22c55e', Latin:     '#fbbf24',
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface TreeNodeData {
  id: number
  depth: number
  isLeaf: boolean
  feature?: string
  threshold?: number
  genre?: string
  samples: number
  gini: number
  left?: TreeNodeData
  right?: TreeNodeData
}

interface TreeResult {
  features: string[]
  classes: string[]
  n_samples: number
  dt: {
    accuracy: number
    feature_importance: Record<string, number>
    tree_text: string
    tree_json: TreeNodeData
  }
  rf: {
    accuracy: number
    feature_importance: Record<string, number>
    n_estimators: number
    classification_report: Record<string, { precision: number; recall: number; f1: number; support: number }>
  }
  error?: string
}

function fetchGenreClassifier(): Promise<TreeResult> {
  return apiFetch<TreeResult>('/analysis/genre-classifier')
}

// ── Layout algorithm ──────────────────────────────────────────────────────────
interface PositionedNode {
  node: TreeNodeData
  leafMid: number   // fractional leaf-index position (used for x)
  leafCount: number
  left?: PositionedNode
  right?: PositionedNode
}

function buildLayout(node: TreeNodeData, counter = { v: 0 }): PositionedNode {
  if (node.isLeaf || !node.left || !node.right) {
    const pos: PositionedNode = { node, leafMid: counter.v, leafCount: 1 }
    counter.v++
    return pos
  }
  const left  = buildLayout(node.left,  counter)
  const right = buildLayout(node.right, counter)
  return {
    node,
    leafMid: (left.leafMid + right.leafMid) / 2,
    leafCount: left.leafCount + right.leafCount,
    left,
    right,
  }
}

// ── SVG Tree ──────────────────────────────────────────────────────────────────
const NW = 144   // node width
const NH = 52    // node height
const HS = 164   // horizontal step per leaf
const VS = 110   // vertical step per level
const PAD = 28

function getXY(leafMid: number, depth: number, _totalLeaves: number, scale: number) {
  const rawX = PAD + leafMid * HS + NW / 2
  const rawY = PAD + depth * VS + NH / 2
  return { x: rawX * scale, y: rawY * scale }
}

function collectEdges(
  p: PositionedNode,
  totalLeaves: number,
  scale: number,
  result: React.ReactNode[] = [],
): React.ReactNode[] {
  if (!p.left || !p.right) return result

  const { x: px, y: py } = getXY(p.leafMid, p.node.depth, totalLeaves, scale)
  const parentColor = FEATURE_COLORS[p.node.feature ?? ''] ?? '#3a3a5c'

  for (const [child, label] of [[p.left, '≤'], [p.right, '>']] as [PositionedNode, string][]) {
    const { x: cx, y: cy } = getXY(child.leafMid, child.node.depth, totalLeaves, scale)
    const y1 = py + (NH / 2) * scale
    const y2 = cy - (NH / 2) * scale
    const my = (y1 + y2) / 2
    const childColor = child.node.isLeaf
      ? (GENRE_COLORS[child.node.genre ?? ''] ?? '#6b6b8a')
      : (FEATURE_COLORS[child.node.feature ?? ''] ?? '#3a3a5c')

    result.push(
      <g key={`edge-${p.node.id}-${child.node.id}`}>
        <defs>
          <linearGradient id={`eg-${p.node.id}-${child.node.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={parentColor} stopOpacity={0.6} />
            <stop offset="100%" stopColor={childColor}  stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <path
          d={`M ${px} ${y1} C ${px} ${my}, ${cx} ${my}, ${cx} ${y2}`}
          stroke={`url(#eg-${p.node.id}-${child.node.id})`}
          strokeWidth={1.8}
          fill="none"
        />
        <text
          x={(px + cx) / 2 + (label === '≤' ? -10 : 10)}
          y={my - 4}
          textAnchor="middle"
          fontSize={9 * scale}
          fontWeight="700"
          fill={label === '≤' ? '#22d3ee' : '#f59e0b'}
          opacity={0.85}
        >
          {label}
        </text>
      </g>,
    )
    collectEdges(child, totalLeaves, scale, result)
  }
  return result
}

function collectNodes(
  p: PositionedNode,
  totalLeaves: number,
  scale: number,
  selected: number | null,
  onSelect: (id: number) => void,
  result: React.ReactNode[] = [],
): React.ReactNode[] {
  const { x, y } = getXY(p.leafMid, p.node.depth, totalLeaves, scale)
  const w = NW * scale
  const h = NH * scale
  const rx = 8 * scale
  const isSelected = p.node.id === selected

  if (p.node.isLeaf) {
    const color = GENRE_COLORS[p.node.genre ?? ''] ?? '#6b6b8a'
    result.push(
      <g
        key={`node-${p.node.id}`}
        style={{ cursor: 'pointer' }}
        onClick={() => onSelect(p.node.id)}
      >
        <rect
          x={x - w / 2} y={y - h / 2} width={w} height={h} rx={rx}
          fill={color + '28'}
          stroke={isSelected ? '#fff' : color}
          strokeWidth={isSelected ? 2.5 * scale : 1.8 * scale}
        />
        <text x={x} y={y - 5 * scale} textAnchor="middle"
          fontSize={10 * scale} fontWeight="700" fill={color}>
          {p.node.genre}
        </text>
        <text x={x} y={y + 9 * scale} textAnchor="middle"
          fontSize={8 * scale} fill="#6b6b8a">
          n={p.node.samples}
        </text>
      </g>,
    )
  } else {
    const color = FEATURE_COLORS[p.node.feature ?? ''] ?? '#6b6b8a'
    result.push(
      <g
        key={`node-${p.node.id}`}
        style={{ cursor: 'pointer' }}
        onClick={() => onSelect(p.node.id)}
      >
        <rect
          x={x - w / 2} y={y - h / 2} width={w} height={h} rx={rx}
          fill={isSelected ? color + '33' : '#14141f'}
          stroke={isSelected ? '#fff' : color}
          strokeWidth={isSelected ? 2.5 * scale : 1.8 * scale}
        />
        <text x={x} y={y - 9 * scale} textAnchor="middle"
          fontSize={10 * scale} fontWeight="700" fill={color} letterSpacing="0.02em">
          {p.node.feature}
        </text>
        <text x={x} y={y + 4 * scale} textAnchor="middle"
          fontSize={10 * scale} fill="#e8e8f0">
          ≤ {p.node.threshold}
        </text>
        <text x={x} y={y + 16 * scale} textAnchor="middle"
          fontSize={7.5 * scale} fill="#6b6b8a">
          n={p.node.samples} · g={p.node.gini.toFixed(2)}
        </text>
      </g>,
    )
  }

  if (p.left)  collectNodes(p.left,  totalLeaves, scale, selected, onSelect, result)
  if (p.right) collectNodes(p.right, totalLeaves, scale, selected, onSelect, result)
  return result
}

// Find a node by id in the layout tree
function findNode(p: PositionedNode, id: number): PositionedNode | null {
  if (p.node.id === id) return p
  if (p.left) { const r = findNode(p.left, id); if (r) return r }
  if (p.right) { const r = findNode(p.right, id); if (r) return r }
  return null
}

function SVGTree({ treeJson }: { treeJson: TreeNodeData }) {
  const [scale, setScale] = useState(0.85)
  const [selected, setSelected] = useState<number | null>(null)

  const layout = useMemo(() => buildLayout(treeJson), [treeJson])
  const totalLeaves = layout.leafCount
  const maxDepth = useMemo(() => {
    let d = 0
    function walk(p: PositionedNode) { d = Math.max(d, p.node.depth); if (p.left) walk(p.left); if (p.right) walk(p.right) }
    walk(layout); return d
  }, [layout])

  const svgW = (PAD * 2 + totalLeaves * HS) * scale
  const svgH = (PAD * 2 + (maxDepth + 1) * VS) * scale

  const edges = useMemo(() => collectEdges(layout, totalLeaves, scale, []), [layout, totalLeaves, scale])
  const nodes = useMemo(() => collectNodes(layout, totalLeaves, scale, selected, setSelected, []), [layout, totalLeaves, scale, selected])

  const selectedNode = selected !== null ? findNode(layout, selected) : null

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-4 mb-3">
        <span className="text-xs" style={{ color: '#6b6b8a' }}>縮放</span>
        <input
          type="range" min={0.4} max={1.2} step={0.05}
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          style={{ width: 120, accentColor: '#ff6b35' }}
        />
        <span className="text-xs tabular-nums" style={{ color: '#9b9bb8' }}>{Math.round(scale * 100)}%</span>
        <button
          onClick={() => setScale(0.85)}
          style={{ fontSize: '0.7rem', color: '#6b6b8a', background: 'none', border: '1px solid #25253a', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}
        >
          重置
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* SVG scroll container */}
        <div
          style={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: 560,
            background: '#0d0d14',
            borderRadius: 10,
            border: '1px solid #25253a',
            minWidth: 0,
          }}
        >
          <svg width={svgW} height={svgH} style={{ display: 'block' }}>
            <g>{edges}</g>
            <g>{nodes}</g>
          </svg>
        </div>

        {/* Selected node detail panel */}
        {selectedNode && (
          <div
            style={{
              flexShrink: 0,
              width: 200,
              background: '#14141f',
              border: `1px solid ${selectedNode.node.isLeaf ? (GENRE_COLORS[selectedNode.node.genre ?? ''] ?? '#6b6b8a') + '66' : (FEATURE_COLORS[selectedNode.node.feature ?? ''] ?? '#6b6b8a') + '66'}`,
              borderRadius: 10,
              padding: '14px 16px',
              fontSize: '0.75rem',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8, color: selectedNode.node.isLeaf ? (GENRE_COLORS[selectedNode.node.genre ?? ''] ?? '#e8e8f0') : (FEATURE_COLORS[selectedNode.node.feature ?? ''] ?? '#e8e8f0') }}>
              {selectedNode.node.isLeaf ? `🍃 ${selectedNode.node.genre}` : `🔀 ${selectedNode.node.feature}`}
            </div>
            {selectedNode.node.isLeaf ? (
              <div className="space-y-1.5" style={{ color: '#9b9bb8' }}>
                <div>類型：<span style={{ color: '#e8e8f0' }}>{selectedNode.node.genre}</span></div>
                <div>樣本數：<span style={{ color: '#e8e8f0' }}>{selectedNode.node.samples}</span></div>
                <div>Gini：<span style={{ color: '#e8e8f0' }}>{selectedNode.node.gini.toFixed(4)}</span></div>
                <div>深度：<span style={{ color: '#e8e8f0' }}>{selectedNode.node.depth}</span></div>
              </div>
            ) : (
              <div className="space-y-1.5" style={{ color: '#9b9bb8' }}>
                <div>條件：<span style={{ color: '#e8e8f0' }}>{selectedNode.node.feature} ≤ {selectedNode.node.threshold}</span></div>
                <div>樣本數：<span style={{ color: '#e8e8f0' }}>{selectedNode.node.samples}</span></div>
                <div>Gini：<span style={{ color: '#e8e8f0' }}>{selectedNode.node.gini.toFixed(4)}</span></div>
                <div>深度：<span style={{ color: '#e8e8f0' }}>{selectedNode.node.depth}</span></div>
                <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #25253a', color: '#6b6b8a', fontSize: '0.68rem' }}>
                  <span style={{ color: '#22d3ee' }}>≤</span> 左子樹（條件成立）<br />
                  <span style={{ color: '#f59e0b' }}>&gt;</span> 右子樹（條件不成立）
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feature colour legend */}
      <div className="flex flex-wrap gap-3 mt-4">
        {Object.entries(FEATURE_COLORS).map(([feat, color]) => (
          <div key={feat} className="flex items-center gap-1.5 text-xs">
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span style={{ color: '#9b9bb8' }}>{feat}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Feature Importance Bars ───────────────────────────────────────────────────
function FeatureImportanceBars({ importance, features }: { importance: Record<string, number>; features: string[] }) {
  const sorted = [...features].sort((a, b) => (importance[b] ?? 0) - (importance[a] ?? 0))
  const max = Math.max(...features.map((f) => importance[f] ?? 0), 0.001)
  return (
    <div className="space-y-1.5">
      {sorted.map((feat, i) => {
        const val = importance[feat] ?? 0
        return (
          <div key={feat} className="flex items-center gap-2 text-xs">
            <div style={{ width: 110, color: rankColor(i), whiteSpace: 'nowrap', flexShrink: 0 }}>{feat}</div>
            <div style={{ flex: 1, background: '#25253a', borderRadius: 3, height: 10 }}>
              <div style={{ width: `${Math.round((val / max) * 100)}%`, height: '100%', background: seqColor(val / max), borderRadius: 3, transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ width: 44, textAlign: 'right', color: '#9b9bb8' }}>{(val * 100).toFixed(1)}%</div>
          </div>
        )
      })}
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Card><Skeleton height={14} width={180} className="mb-3" /><Skeleton height={120} /></Card>
      <Card><Skeleton height={14} width={160} className="mb-3" /><Skeleton height={400} /></Card>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function TreeModelPage() {
  const t = useT()
  const [tab, setTab] = useState<'dt' | 'rf'>('dt')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['genre-classifier'],
    queryFn: fetchGenreClassifier,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  })

  if (isLoading) return (
    <div><PageTitle title={t('page.tree.title')} subtitle={t('page.tree.subtitle')} /><PageSkeleton /></div>
  )

  if (isError) return (
    <div>
      <PageTitle title={t('page.tree.title')} subtitle={t('page.tree.subtitle')} />
      <EmptyState message={t('ui.run_pipeline')} />
    </div>
  )

  if (!data || data.error) return (
    <div>
      <PageTitle title={t('page.tree.title')} subtitle={t('page.tree.subtitle')} />
      <EmptyState message={data?.error ?? t('ui.run_pipeline')} />
    </div>
  )

  const taskDesc = t('tree.task_desc')
    .replace('{n}', String(data.classes.length))
    .replace('{samples}', data.n_samples.toLocaleString())

  return (
    <div>
      <PageTitle title={t('page.tree.title')} subtitle={t('page.tree.subtitle')} />

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: t('tree.n_samples'), val: data.n_samples.toLocaleString() },
          { label: t('tree.n_classes'),  val: String(data.classes.length) },
          { label: 'DT / RF ' + t('tree.accuracy'), val: `${(data.dt.accuracy * 100).toFixed(1)}% / ${(data.rf.accuracy * 100).toFixed(1)}%` },
        ].map(({ label, val }) => (
          <div key={label} style={{ background: '#14141f', border: '1px solid #25253a', borderRadius: 8, padding: '10px 14px' }}>
            <div className="text-xs mb-1" style={{ color: '#6b6b8a' }}>{label}</div>
            <div className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>{val}</div>
          </div>
        ))}
      </div>
      <p className="text-xs mb-4" style={{ color: '#6b6b8a' }}>{taskDesc}</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['dt', 'rf'] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '6px 16px', borderRadius: 6, fontSize: '0.8rem',
            fontWeight: tab === k ? 600 : 400,
            background: tab === k ? '#ff6b35' : '#14141f',
            color: tab === k ? '#0d0d14' : '#6b6b8a',
            border: tab === k ? 'none' : '1px solid #25253a',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {t(`tree.tab.${k}`)}
          </button>
        ))}
      </div>

      {/* ── Decision Tree Tab ─────────────────────────────── */}
      {tab === 'dt' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>{t('tree.tab.dt')}</h2>
              <span style={{ background: '#ff6b3522', color: '#ff6b35', borderRadius: 4, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                {t('tree.accuracy')}: {(data.dt.accuracy * 100).toFixed(1)}%
              </span>
            </div>
            <div className="mb-4">
              <h3 className="text-xs font-medium mb-3" style={{ color: '#9b9bb8' }}>{t('tree.feature_importance')}</h3>
              <FeatureImportanceBars importance={data.dt.feature_importance} features={data.features} />
            </div>
            <InsightPanel>{t('tree.dt_insight')}</InsightPanel>
          </Card>

          {/* SVG Tree visualization */}
          <Card>
            <h2 className="text-sm font-semibold mb-1" style={{ color: '#e8e8f0' }}>{t('tree.rules_title')}</h2>
            <p className="text-xs mb-4" style={{ color: '#6b6b8a' }}>
              {t('tree.rules_hint')} · 點擊節點查看詳細資訊
            </p>
            {data.dt.tree_json
              ? <SVGTree treeJson={data.dt.tree_json} />
              : <p style={{ color: '#6b6b8a', fontSize: '0.8rem' }}>樹狀資料載入中…</p>
            }
          </Card>
        </div>
      )}

      {/* ── Random Forest Tab ─────────────────────────────── */}
      {tab === 'rf' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>{t('tree.tab.rf')}</h2>
              <span style={{ background: '#a78bfa22', color: '#a78bfa', borderRadius: 4, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                {t('tree.accuracy')}: {(data.rf.accuracy * 100).toFixed(1)}%
              </span>
              <span style={{ color: '#6b6b8a', fontSize: '0.75rem' }}>{data.rf.n_estimators} trees</span>
            </div>
            <div className="mb-4">
              <h3 className="text-xs font-medium mb-3" style={{ color: '#9b9bb8' }}>{t('tree.feature_importance')}</h3>
              <FeatureImportanceBars importance={data.rf.feature_importance} features={data.features} />
            </div>
            <InsightPanel>{t('tree.rf_insight')}</InsightPanel>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#e8e8f0' }}>{t('tree.per_genre')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #25253a' }}>
                    <th className="text-left py-2 pr-4" style={{ color: '#6b6b8a' }}>Genre</th>
                    <th className="text-right py-2 px-2" style={{ color: '#6b6b8a' }}>{t('tree.precision')}</th>
                    <th className="text-right py-2 px-2" style={{ color: '#6b6b8a' }}>{t('tree.recall')}</th>
                    <th className="text-right py-2 px-2" style={{ color: '#6b6b8a' }}>{t('tree.f1')}</th>
                    <th className="text-right py-2 px-2" style={{ color: '#6b6b8a' }}>{t('tree.support')}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.rf.classification_report)
                    .sort(([, a], [, b]) => b.f1 - a.f1)
                    .map(([genre, m]) => (
                      <tr key={genre} style={{ borderBottom: '1px solid #1a1a2e' }}>
                        <td className="py-2 pr-4 font-medium" style={{ color: GENRE_COLORS[genre] ?? seqColor(m.f1) }}>{genre}</td>
                        <td className="text-right py-2 px-2 tabular-nums" style={{ color: '#e8e8f0' }}>{(m.precision * 100).toFixed(0)}%</td>
                        <td className="text-right py-2 px-2 tabular-nums" style={{ color: '#e8e8f0' }}>{(m.recall * 100).toFixed(0)}%</td>
                        <td className="text-right py-2 px-2 tabular-nums" style={{ color: seqColor(m.f1), fontWeight: 600 }}>{(m.f1 * 100).toFixed(0)}%</td>
                        <td className="text-right py-2 px-2 tabular-nums" style={{ color: '#6b6b8a' }}>{m.support}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
