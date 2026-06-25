import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMemo } from 'react'

const MODEL_COLORS: Record<string, string> = {
  popularity: '#ff6b35',
  als: '#22d3ee',
  content: '#a78bfa',
  hybrid: '#34d399',
}

interface Props {
  playCounts: number[]
  modelAvgRanks: Record<string, number>
}

export function PopularityLogLog({ playCounts, modelAvgRanks }: Props) {
  // Downsample to ~300 points for rendering performance (log-log still looks correct)
  const data = useMemo(() => {
    const n = playCounts.length
    const step = Math.max(1, Math.floor(n / 300))
    return playCounts
      .filter((_, i) => i % step === 0)
      .map((count, idx) => ({ rank: idx * step + 1, count }))
  }, [playCounts])

  return (
    <div>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data} margin={{ top: 10, right: 30, bottom: 30, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#25253a" />
          <XAxis
            dataKey="rank"
            scale="log"
            domain={['auto', 'auto']}
            type="number"
            tick={{ fill: '#6b6b8a', fontSize: 11 }}
            label={{ value: 'Rank (log)', position: 'insideBottom', offset: -15, fill: '#6b6b8a', fontSize: 12 }}
          />
          <YAxis
            dataKey="count"
            scale="log"
            domain={['auto', 'auto']}
            type="number"
            tick={{ fill: '#6b6b8a', fontSize: 11 }}
            label={{ value: 'Play Count (log)', angle: -90, position: 'insideLeft', fill: '#6b6b8a', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{ background: '#14141f', border: '1px solid #25253a', borderRadius: 8 }}
            labelStyle={{ color: '#e8e8f0', fontSize: 11 }}
            itemStyle={{ color: '#e8e8f0', fontSize: 11 }}
            formatter={(v: any) => [(v as number).toLocaleString(), 'plays']}
            labelFormatter={(r: any) => `Rank ${(r as number).toLocaleString()}`}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#ff6b35"
            dot={false}
            strokeWidth={2}
            name="Play count"
          />
          {Object.entries(modelAvgRanks).map(([model, rank]) => (
            <ReferenceLine
              key={model}
              x={rank}
              stroke={MODEL_COLORS[model] ?? '#888'}
              strokeDasharray="4 2"
              label={{
                value: model,
                position: 'insideTopRight',
                fill: MODEL_COLORS[model] ?? '#888',
                fontSize: 10,
              }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {Object.entries(modelAvgRanks).map(([model, rank]) => (
          <div key={model} className="flex items-center gap-1.5 text-xs" style={{ color: MODEL_COLORS[model] }}>
            <span className="inline-block w-3 h-0.5" style={{ background: MODEL_COLORS[model] }} />
            {model} avg rank: {rank.toLocaleString()}
          </div>
        ))}
      </div>
    </div>
  )
}
