import { useState } from 'react'
import { Card, PageTitle, Spinner, EmptyState, InsightPanel } from '@/components/ui/index'
import { useT } from '@/hooks/useT'
import { useCorrelation } from '@/hooks/useAnalytics'
import { useTourAnchor } from '@/hooks/useTourAnchor'
import { divColor } from '@/utils/colorScale'

const CELL = 52

interface HoveredCell {
  row: number
  col: number
  value: number
  x: number
  y: number
}

function findExtremes(_features: string[], matrix: number[][]) {
  let maxPos = { val: -Infinity, r: 0, c: 0 }
  let maxNeg = { val: Infinity, r: 0, c: 0 }
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < (matrix[r]?.length ?? 0); c++) {
      if (r === c) continue
      const v = matrix[r]?.[c] ?? NaN
      if (isNaN(v)) continue
      if (v > maxPos.val) maxPos = { val: v, r, c }
      if (v < maxNeg.val) maxNeg = { val: v, r, c }
    }
  }
  return { maxPos, maxNeg }
}

export function CorrelationPage() {
  const t = useT()
  useTourAnchor(['corr-matrix'])
  const { data, isLoading } = useCorrelation()
  const [hovered, setHovered] = useState<HoveredCell | null>(null)

  const features = data?.features ?? []
  const matrix = data?.matrix ?? []
  const n = features.length

  const labelPad = 100
  const topPad = 120
  const svgWidth = labelPad + n * CELL + 16
  const svgHeight = topPad + n * CELL + 16

  const { maxPos, maxNeg } = data ? findExtremes(features, matrix) : { maxPos: null, maxNeg: null }

  return (
    <div>
      <PageTitle
        title={t('page.correlation.title')}
        subtitle={data ? `${n} audio features · ${data.n_tracks.toLocaleString()} tracks` : t('page.correlation.subtitle')}
      />

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={28} />
        </div>
      )}

      {!isLoading && data && features.length > 0 && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#e8e8f0' }}>
              Audio Feature Correlations
            </h3>
            <p className="text-xs mb-4" style={{ color: '#6b6b8a' }}>
              Orange = positive correlation · Cyan = negative · Dark = no correlation · Hover a cell for the exact value
            </p>

            <div
              data-tour-anchor="corr-matrix"
              className="overflow-x-auto"
            >
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <svg
                  width={svgWidth}
                  height={svgHeight}
                  style={{ display: 'block' }}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Column labels (rotated) */}
                  {features.map((feat, ci) => (
                    <text
                      key={`col-${ci}`}
                      x={labelPad + ci * CELL + CELL / 2}
                      y={topPad - 8}
                      fontSize={10}
                      fill="#6b6b8a"
                      textAnchor="start"
                      transform={`rotate(-45, ${labelPad + ci * CELL + CELL / 2}, ${topPad - 8})`}
                      style={{ userSelect: 'none' }}
                    >
                      {feat}
                    </text>
                  ))}

                  {/* Row labels */}
                  {features.map((feat, ri) => (
                    <text
                      key={`row-${ri}`}
                      x={labelPad - 8}
                      y={topPad + ri * CELL + CELL / 2 + 4}
                      fontSize={10}
                      fill="#6b6b8a"
                      textAnchor="end"
                      style={{ userSelect: 'none' }}
                    >
                      {feat}
                    </text>
                  ))}

                  {/* Cells */}
                  {matrix.map((row, ri) =>
                    row.map((val, ci) => {
                      const cx = labelPad + ci * CELL
                      const cy = topPad + ri * CELL
                      const isHov = hovered?.row === ri && hovered?.col === ci
                      return (
                        <rect
                          key={`${ri}-${ci}`}
                          x={cx + 1}
                          y={cy + 1}
                          width={CELL - 2}
                          height={CELL - 2}
                          rx={3}
                          fill={ri === ci ? '#ff6b35' : divColor(val)}
                          stroke={isHov ? '#e8e8f0' : 'transparent'}
                          strokeWidth={1.5}
                          style={{ cursor: 'crosshair' }}
                          onMouseEnter={(e) => {
                            ;(e.currentTarget as SVGRectElement)
                              .closest('svg')!
                              .getBoundingClientRect()
                            setHovered({
                              row: ri,
                              col: ci,
                              value: val,
                              x: cx + CELL / 2,
                              y: cy,
                            })
                          }}
                        />
                      )
                    })
                  )}

                  {/* Hover tooltip inside SVG */}
                  {hovered && (
                    <g>
                      <rect
                        x={Math.min(hovered.x - 30, svgWidth - 80)}
                        y={hovered.y - 32}
                        width={72}
                        height={24}
                        rx={4}
                        fill="#0d0d14"
                        stroke="#25253a"
                        strokeWidth={1}
                      />
                      <text
                        x={Math.min(hovered.x - 30, svgWidth - 80) + 36}
                        y={hovered.y - 14}
                        fontSize={11}
                        fill="#e8e8f0"
                        textAnchor="middle"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {isNaN(hovered.value) ? 'N/A' : hovered.value.toFixed(3)}
                      </text>
                    </g>
                  )}
                </svg>
              </div>
            </div>

            {/* Diverging color legend */}
            <div className="flex items-center gap-3 mt-4 text-xs" style={{ color: '#6b6b8a' }}>
              <span style={{ color: '#22d3ee' }}>−1 (neg)</span>
              <div
                style={{
                  flex: 1,
                  height: 10,
                  borderRadius: 4,
                  background: 'linear-gradient(to right, #22d3ee, #0e4f6e, #1a1a2e, #7c2d12, #ff6b35)',
                }}
              />
              <span style={{ color: '#ff6b35' }}>+1 (pos)</span>
            </div>

            {maxPos && maxNeg && (
              <InsightPanel>
                <span style={{ color: '#ff6b35', fontWeight: 600 }}>
                  {features[maxPos.r]} ↔ {features[maxPos.c]}
                </span>
                {' '}has the highest positive correlation ({maxPos.val.toFixed(3)}) — these features tend to rise together.{' '}
                <span style={{ color: '#22d3ee', fontWeight: 600 }}>
                  {features[maxNeg.r]} ↔ {features[maxNeg.c]}
                </span>
                {' '}has the strongest negative correlation ({maxNeg.val.toFixed(3)}) — they move in opposite directions.
              </InsightPanel>
            )}
          </Card>
        </div>
      )}

      {!isLoading && (!data || features.length === 0) && (
        <EmptyState message="No correlation data available — run the pipeline to generate audio features." />
      )}
    </div>
  )
}
