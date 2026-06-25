import { useState } from 'react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card, PageTitle, Spinner, EmptyState, InsightPanel } from '@/components/ui/index'
import { useT } from '@/hooks/useT'
import { useListeningPatterns } from '@/hooks/useAnalytics'
import { useTourAnchor } from '@/hooks/useTourAnchor'
import { seqColor } from '@/utils/colorScale'

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const CELL_W = 14
const CELL_H = 14
const GAP = 2
const GRID_LEFT_PAD = 36
const GRID_TOP_PAD = 24

interface GridTooltip {
  dow: number
  hour: number
  count: number
  x: number
  y: number
}

export function ListeningPatternsPage() {
  const t = useT()
  useTourAnchor(['patterns-chart'])
  const { data, isLoading } = useListeningPatterns()
  const [tooltip, setTooltip] = useState<GridTooltip | null>(null)

  const hourCounts = data?.hour_counts ?? []
  const dowCounts = data?.dow_counts ?? []
  const heatmap = data?.heatmap ?? []

  const hourChartData = hourCounts.map((count, h) => ({
    hour: `${h}h`,
    count,
  }))

  // Build lookup map for heatmap
  const heatLookup = new Map<string, number>()
  heatmap.forEach(({ dow, hour, count }) => {
    heatLookup.set(`${dow}-${hour}`, count)
  })
  const maxHeat = Math.max(...heatmap.map((d) => d.count), 1)

  // Peak hour
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts, 0))
  // Most active day
  const peakDow = dowCounts.indexOf(Math.max(...dowCounts, 0))

  const gridSvgWidth = GRID_LEFT_PAD + 24 * (CELL_W + GAP) + 16
  const gridSvgHeight = GRID_TOP_PAD + 7 * (CELL_H + GAP) + 8

  return (
    <div>
      <PageTitle
        title={t('page.patterns.title')}
        subtitle={data ? `${data.total_listens.toLocaleString()} total listens analysed` : t('page.patterns.subtitle')}
      />

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={28} />
        </div>
      )}

      {!isLoading && data && (
        <div className="space-y-6">
          {/* Hourly bar chart */}
          <Card>
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#e8e8f0' }}>
              {t('patterns.hour_chart')}
            </h3>
            <p className="text-xs mb-4" style={{ color: '#6b6b8a' }}>
              {t('patterns.hour_desc')}
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourChartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#25253a" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: '#6b6b8a', fontSize: 10 }}
                  axisLine={{ stroke: '#25253a' }}
                  tickLine={false}
                  interval={3}
                />
                <YAxis
                  tick={{ fill: '#6b6b8a', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{ background: '#0d0d14', border: '1px solid #25253a', borderRadius: 6 }}
                  labelStyle={{ color: '#e8e8f0', fontSize: 11 }}
                  itemStyle={{ color: '#ff6b35', fontSize: 11 }}
                  cursor={{ fill: 'rgba(255,107,53,0.08)' }}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={24}>
                  {hourChartData.map((entry, idx) => {
                    const maxHourCount = Math.max(...hourCounts, 1)
                    return <Cell key={idx} fill={seqColor(entry.count / maxHourCount)} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Heatmap grid */}
          <Card>
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#e8e8f0' }}>
              {t('patterns.heatmap')}
            </h3>
            <p className="text-xs mb-4" style={{ color: '#6b6b8a' }}>
              GitHub-style contribution grid — brighter = more listens
            </p>

            <div
              data-tour-anchor="patterns-chart"
              className="overflow-x-auto"
            >
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <svg
                  width={gridSvgWidth}
                  height={gridSvgHeight}
                  style={{ display: 'block' }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {/* Hour labels every 4 hours */}
                  {[0, 4, 8, 12, 16, 20].map((h) => (
                    <text
                      key={`hlabel-${h}`}
                      x={GRID_LEFT_PAD + h * (CELL_W + GAP) + CELL_W / 2}
                      y={14}
                      fontSize={9}
                      fill="#6b6b8a"
                      textAnchor="middle"
                      style={{ userSelect: 'none' }}
                    >
                      {h}
                    </text>
                  ))}

                  {/* DOW labels */}
                  {DOW_LABELS.map((label, d) => (
                    <text
                      key={`dlabel-${d}`}
                      x={GRID_LEFT_PAD - 4}
                      y={GRID_TOP_PAD + d * (CELL_H + GAP) + CELL_H / 2 + 4}
                      fontSize={9}
                      fill="#6b6b8a"
                      textAnchor="end"
                      style={{ userSelect: 'none' }}
                    >
                      {label}
                    </text>
                  ))}

                  {/* Cells */}
                  {Array.from({ length: 7 }, (_, dow) =>
                    Array.from({ length: 24 }, (_, hour) => {
                      const count = heatLookup.get(`${dow}-${hour}`) ?? 0
                      const cx = GRID_LEFT_PAD + hour * (CELL_W + GAP)
                      const cy = GRID_TOP_PAD + dow * (CELL_H + GAP)
                      return (
                        <rect
                          key={`${dow}-${hour}`}
                          x={cx}
                          y={cy}
                          width={CELL_W}
                          height={CELL_H}
                          rx={2}
                          fill={seqColor(maxHeat > 0 ? count / maxHeat : 0)}
                          stroke={
                            tooltip?.dow === dow && tooltip?.hour === hour
                              ? '#e8e8f0'
                              : 'transparent'
                          }
                          strokeWidth={1}
                          style={{ cursor: 'default' }}
                          onMouseEnter={() =>
                            setTooltip({ dow, hour, count, x: cx + CELL_W / 2, y: cy })
                          }
                        />
                      )
                    })
                  )}

                  {/* Tooltip */}
                  {tooltip && (
                    <g>
                      <rect
                        x={Math.min(tooltip.x - 40, gridSvgWidth - 96)}
                        y={tooltip.y - 36}
                        width={90}
                        height={28}
                        rx={4}
                        fill="#0d0d14"
                        stroke="#25253a"
                        strokeWidth={1}
                      />
                      <text
                        x={Math.min(tooltip.x - 40, gridSvgWidth - 96) + 45}
                        y={tooltip.y - 18}
                        fontSize={10}
                        fill="#e8e8f0"
                        textAnchor="middle"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {DOW_LABELS[tooltip.dow]} {tooltip.hour}:00
                      </text>
                      <text
                        x={Math.min(tooltip.x - 40, gridSvgWidth - 96) + 45}
                        y={tooltip.y - 6}
                        fontSize={10}
                        fill="#ff6b35"
                        textAnchor="middle"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {tooltip.count.toLocaleString()} listens
                      </text>
                    </g>
                  )}
                </svg>
              </div>
            </div>

            {/* Colour legend */}
            <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: '#6b6b8a' }}>
              <span>{t('patterns.legend.less')}</span>
              <div
                style={{
                  flex: 1,
                  height: 10,
                  borderRadius: 4,
                  background: 'linear-gradient(to right, #0d0d14, #1e3a5f, #0e7490, #d97706, #ff6b35)',
                  maxWidth: 120,
                }}
              />
              <span>{t('patterns.legend.more')}</span>
            </div>

            <InsightPanel>
              Peak listening hour is{' '}
              <span style={{ color: '#ff6b35', fontWeight: 600 }}>{peakHour}:00</span> with{' '}
              {hourCounts[peakHour]?.toLocaleString()} listens.{' '}
              Most active day is{' '}
              <span style={{ color: '#ff6b35', fontWeight: 600 }}>{DOW_LABELS[peakDow]}</span> with{' '}
              {dowCounts[peakDow]?.toLocaleString()} total listens.
            </InsightPanel>
          </Card>
        </div>
      )}

      {!isLoading && !data && (
        <EmptyState message="No listening pattern data — run the pipeline to generate listen events." />
      )}
    </div>
  )
}
