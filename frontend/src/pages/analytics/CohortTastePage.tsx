import { useState } from 'react'
import { Card, PageTitle, Spinner, EmptyState, InsightPanel } from '@/components/ui/index'
import { useT } from '@/hooks/useT'
import { useCohortTaste } from '@/hooks/useAnalytics'
import { useTourAnchor } from '@/hooks/useTourAnchor'
import { seqColor, seqTextColor } from '@/utils/colorScale'

const CELL_W = 80
const CELL_H = 40
const LEFT_PAD = 80
const TOP_PAD = 100

interface HoveredCell {
  row: number
  col: number
  value: number
}

export function CohortTastePage() {
  const t = useT()
  useTourAnchor(['cohorts-heat'])
  const { data, isLoading } = useCohortTaste()
  const [hovered, setHovered] = useState<HoveredCell | null>(null)

  // Use up to 8 genres
  const ageGroups = data?.age_groups ?? []
  const allGenres = data?.genres ?? []
  const genres = allGenres.slice(0, 8)
  const matrix = data?.matrix ?? {}

  // Find age group with most distinctive preferences (highest max value)
  let mostDistinctiveGroup = ''
  let mostDistinctiveMax = -1
  ageGroups.forEach((ag) => {
    const vals = genres.map((g) => matrix[ag]?.[g] ?? 0)
    const mx = Math.max(...vals)
    if (mx > mostDistinctiveMax) {
      mostDistinctiveMax = mx
      mostDistinctiveGroup = ag
    }
  })

  const svgWidth = LEFT_PAD + genres.length * CELL_W + 16
  const svgHeight = TOP_PAD + ageGroups.length * CELL_H + 16

  return (
    <div>
      <PageTitle
        title={t('page.cohorts.title')}
        subtitle={t('page.cohorts.subtitle')}
      />

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={28} />
        </div>
      )}

      {!isLoading && data && ageGroups.length > 0 && genres.length > 0 && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#e8e8f0' }}>
              Age Group × Genre Heatmap
            </h3>
            <p className="text-xs mb-4" style={{ color: '#6b6b8a' }}>
              Cell colour = % of listens in that age group that fall in the genre. Darker = more dominant.
            </p>

            <div
              data-tour-anchor="cohorts-heat"
              className="overflow-x-auto"
            >
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <svg
                  width={svgWidth}
                  height={svgHeight}
                  style={{ display: 'block' }}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Column labels (genres, rotated) */}
                  {genres.map((genre, ci) => (
                    <text
                      key={`gcol-${ci}`}
                      x={LEFT_PAD + ci * CELL_W + CELL_W / 2}
                      y={TOP_PAD - 8}
                      fontSize={10}
                      fill="#6b6b8a"
                      textAnchor="start"
                      transform={`rotate(-45, ${LEFT_PAD + ci * CELL_W + CELL_W / 2}, ${TOP_PAD - 8})`}
                      style={{ userSelect: 'none' }}
                    >
                      {genre}
                    </text>
                  ))}

                  {/* Row labels (age groups) */}
                  {ageGroups.map((ag, ri) => (
                    <text
                      key={`agrow-${ri}`}
                      x={LEFT_PAD - 8}
                      y={TOP_PAD + ri * CELL_H + CELL_H / 2 + 4}
                      fontSize={10}
                      fill="#6b6b8a"
                      textAnchor="end"
                      style={{ userSelect: 'none' }}
                    >
                      {ag}
                    </text>
                  ))}

                  {/* Cells */}
                  {ageGroups.map((ag, ri) =>
                    genres.map((genre, ci) => {
                      const val = matrix[ag]?.[genre] ?? 0
                      const cx = LEFT_PAD + ci * CELL_W
                      const cy = TOP_PAD + ri * CELL_H
                      const isHov = hovered?.row === ri && hovered?.col === ci
                      return (
                        <g key={`${ri}-${ci}`}>
                          <rect
                            x={cx + 1}
                            y={cy + 1}
                            width={CELL_W - 2}
                            height={CELL_H - 2}
                            rx={3}
                            fill={seqColor(val / 100)}
                            stroke={isHov ? '#e8e8f0' : '#25253a'}
                            strokeWidth={isHov ? 1.5 : 0.5}
                            style={{ cursor: 'default' }}
                            onMouseEnter={() => setHovered({ row: ri, col: ci, value: val })}
                          />
                          <text
                            x={cx + CELL_W / 2}
                            y={cy + CELL_H / 2 + 4}
                            fontSize={9}
                            fill={seqTextColor(val / 100)}
                            textAnchor="middle"
                            style={{ pointerEvents: 'none', userSelect: 'none' }}
                          >
                            {val.toFixed(1)}%
                          </text>
                        </g>
                      )
                    })
                  )}
                </svg>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 mt-4 text-xs" style={{ color: '#6b6b8a' }}>
              <span>0%</span>
              <div
                style={{
                  flex: 1,
                  height: 10,
                  borderRadius: 4,
                  background: 'linear-gradient(to right, #0d0d14, #1e3a5f, #0e7490, #d97706, #ff6b35)',
                  maxWidth: 120,
                }}
              />
              <span>100%</span>
            </div>

            {mostDistinctiveGroup && (
              <InsightPanel>
                <span style={{ color: '#ff6b35', fontWeight: 600 }}>{mostDistinctiveGroup}</span>
                {' '}shows the most distinctive genre preferences, with up to{' '}
                <span style={{ color: '#ff6b35', fontWeight: 600 }}>
                  {mostDistinctiveMax.toFixed(1)}%
                </span>
                {' '}concentration in a single genre. Age groups with high concentration in one genre tend to have the most predictable recommendation targets.
              </InsightPanel>
            )}
          </Card>
        </div>
      )}

      {!isLoading && (!data || ageGroups.length === 0) && (
        <EmptyState message="No cohort data available — run the pipeline to generate user listen events." />
      )}
    </div>
  )
}
