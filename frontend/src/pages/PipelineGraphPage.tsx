import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '@/components/ui/index'
import { useT } from '@/hooks/useT'

type Group = 'data' | 'features' | 'models' | 'retrieval' | 'evaluation'

interface NodeDef {
  id: string
  group: Group
  icon: string
  pageLink?: string
}

const GROUP_COLORS: Record<Group, string> = {
  data:       '#22d3ee',
  features:   '#a78bfa',
  models:     '#ff6b35',
  retrieval:  '#34d399',
  evaluation: '#f59e0b',
}

const GROUPS: { key: Group; nodes: NodeDef[] }[] = [
  {
    key: 'data',
    nodes: [
      { id: 'raw_csv',    group: 'data', icon: '📁' },
      { id: 'cleaner',    group: 'data', icon: '🧹' },
      { id: 'normalizer', group: 'data', icon: '⚖️' },
      { id: 'duckdb',     group: 'data', icon: '🦆' },
    ],
  },
  {
    key: 'features',
    nodes: [
      { id: 'audio_features', group: 'features', icon: '🎵' },
      { id: 'tag_tfidf',      group: 'features', icon: '🏷️' },
      { id: 'embeddings',     group: 'features', icon: '🧠', pageLink: '/similar' },
    ],
  },
  {
    key: 'models',
    nodes: [
      { id: 'popularity_model', group: 'models', icon: '📈', pageLink: '/analytics/popularity' },
      { id: 'item_sim',         group: 'models', icon: '🔗', pageLink: '/similar' },
      { id: 'als',              group: 'models', icon: '🤝', pageLink: '/recommend' },
      { id: 'content_model',    group: 'models', icon: '🎯', pageLink: '/recommend' },
      { id: 'hybrid_model',     group: 'models', icon: '⚡', pageLink: '/recommend' },
    ],
  },
  {
    key: 'retrieval',
    nodes: [
      { id: 'bm25',         group: 'retrieval', icon: '🔍', pageLink: '/search' },
      { id: 'faiss',        group: 'retrieval', icon: '📐', pageLink: '/search' },
      { id: 'hybrid_search',group: 'retrieval', icon: '🔀', pageLink: '/search' },
    ],
  },
  {
    key: 'evaluation',
    nodes: [
      { id: 'evaluator', group: 'evaluation', icon: '📊', pageLink: '/evaluation' },
      { id: 'results',   group: 'evaluation', icon: '✅', pageLink: '/evaluation' },
    ],
  },
]

function Arrow() {
  return (
    <span style={{ color: '#3a3a5c', fontSize: '1rem', userSelect: 'none', padding: '0 2px' }}>
      →
    </span>
  )
}

function GroupConnector({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
      <div style={{ width: 2, height: 20, background: `${color}55`, borderRadius: 1 }} />
    </div>
  )
}

export function PipelineGraphPage() {
  const t = useT()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<NodeDef | null>(null)

  const color = selected ? GROUP_COLORS[selected.group] : '#6b6b8a'

  return (
    <div>
      <PageTitle
        title={t('page.pipeline_graph.title')}
        subtitle={t('page.pipeline_graph.subtitle')}
      />

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* ── Left: Graph ──────────────────────────────────────── */}
        <div style={{ flex: '0 0 auto', minWidth: 0 }}>
          {GROUPS.map((group, gi) => {
            const groupColor = GROUP_COLORS[group.key]
            return (
              <div key={group.key}>
                {/* Group header */}
                <div
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: groupColor,
                    padding: '4px 0 6px 4px',
                    marginTop: gi === 0 ? 0 : 4,
                  }}
                >
                  {t(`pipeline.group.${group.key}`)}
                </div>

                {/* Nodes row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  {group.nodes.map((node, ni) => {
                    const isSelected = selected?.id === node.id
                    return (
                      <div key={node.id} style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                          onClick={() => setSelected(isSelected ? null : node)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                            padding: '8px 10px',
                            background: isSelected ? `${groupColor}22` : '#14141f',
                            border: `1.5px solid ${isSelected ? groupColor : '#25253a'}`,
                            borderRadius: 8,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            minWidth: 72,
                          }}
                        >
                          <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{node.icon}</span>
                          <span
                            style={{
                              fontSize: '0.6rem',
                              color: isSelected ? groupColor : '#9b9bb8',
                              textAlign: 'center',
                              maxWidth: 64,
                              lineHeight: 1.3,
                              wordBreak: 'break-word',
                            }}
                          >
                            {t(`pipeline.node.${node.id}.name`)}
                          </span>
                        </button>
                        {ni < group.nodes.length - 1 && <Arrow />}
                      </div>
                    )
                  })}
                </div>

                {gi < GROUPS.length - 1 && <GroupConnector color={GROUP_COLORS[GROUPS[gi + 1]!.key]} />}
              </div>
            )
          })}
        </div>

        {/* ── Right: Detail panel ───────────────────────────────── */}
        <div
          style={{
            flex: 1,
            background: '#14141f',
            border: `1px solid ${selected ? color + '55' : '#25253a'}`,
            borderLeft: `3px solid ${color}`,
            borderRadius: 10,
            padding: 20,
            minHeight: 300,
            transition: 'border-color 0.2s',
          }}
        >
          {!selected ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 280,
                color: '#3a3a5c',
                textAlign: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: '2.5rem' }}>🗺️</span>
              <p style={{ fontSize: '0.85rem' }}>{t('pipeline.click_hint')}</p>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <span style={{ fontSize: '1.8rem' }}>{selected.icon}</span>
                <div>
                  <div style={{ fontSize: '0.65rem', color: color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {t(`pipeline.group.${selected.group}`)}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e8e8f0' }}>
                    {t(`pipeline.node.${selected.id}.name`)}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: '0.82rem', color: '#c8c8e0', lineHeight: 1.6, marginBottom: 16 }}>
                {t(`pipeline.node.${selected.id}.desc`)}
              </p>

              {/* Input / Output */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                {([['input_label', 'input'], ['output_label', 'output']] as const).map(([labelKey, fieldKey]) => (
                  <div
                    key={fieldKey}
                    style={{ background: '#0d0d14', borderRadius: 6, padding: '10px 12px', border: '1px solid #25253a' }}
                  >
                    <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b6b8a', marginBottom: 4 }}>
                      {t(`pipeline.${labelKey}`)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#e8e8f0', lineHeight: 1.5 }}>
                      {t(`pipeline.node.${selected.id}.${fieldKey}`)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tech details */}
              <div style={{ background: '#0d0d14', borderRadius: 6, padding: '10px 12px', border: '1px solid #25253a', marginBottom: 14 }}>
                <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b6b8a', marginBottom: 4 }}>
                  {t('pipeline.tech_label')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#a78bfa', fontFamily: 'ui-monospace, monospace' }}>
                  {t(`pipeline.node.${selected.id}.tech`)}
                </div>
              </div>

              {/* Go to page button */}
              {selected.pageLink && (
                <button
                  onClick={() => navigate(selected.pageLink!)}
                  style={{
                    background: `${color}22`,
                    color,
                    border: `1px solid ${color}55`,
                    borderRadius: 6,
                    padding: '7px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {t('pipeline.go_to_page')} →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
