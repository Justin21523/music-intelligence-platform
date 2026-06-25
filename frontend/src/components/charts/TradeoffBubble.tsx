import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { EvalRow } from '@/types/api'

const MODEL_COLORS: Record<string, string> = {
  popularity: '#ff6b35',
  item_similarity: '#f7c59f',
  als: '#22d3ee',
  content: '#a78bfa',
  hybrid: '#34d399',
}

interface Props {
  rows: EvalRow[]
}

export function TradeoffBubble({ rows }: Props) {
  const data = rows.map((r) => ({
    model: r.model,
    x: Number(r.novelty ?? 0),
    y: Number(r.diversity ?? 0),
    z: Math.max(1, Number(r.coverage ?? 0) * 3000),
    coverage: Number(r.coverage ?? 0),
    novelty: Number(r.novelty ?? 0),
    diversity: Number(r.diversity ?? 0),
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={360}>
        <ScatterChart margin={{ top: 20, right: 40, bottom: 30, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#25253a" />
          <XAxis
            type="number"
            dataKey="x"
            name="Novelty"
            tick={{ fill: '#6b6b8a', fontSize: 11 }}
            label={{ value: 'Novelty (higher = more obscure tracks)', position: 'insideBottom', offset: -15, fill: '#6b6b8a', fontSize: 12 }}
            domain={[6, 20]}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Diversity"
            tick={{ fill: '#6b6b8a', fontSize: 11 }}
            label={{ value: 'Diversity (higher = more varied list)', angle: -90, position: 'insideLeft', fill: '#6b6b8a', fontSize: 12 }}
            domain={[0, 0.30]}
          />
          <ZAxis type="number" dataKey="z" range={[80, 1400]} name="Coverage" />
          <Tooltip
            contentStyle={{ background: '#14141f', border: '1px solid #25253a', borderRadius: 8 }}
            labelStyle={{ color: '#e8e8f0' }}
            itemStyle={{ color: '#e8e8f0', fontSize: 11 }}
            cursor={false}
            content={({ payload }) => {
              if (!payload?.length) return null
              const d = payload[0].payload as (typeof data)[0]
              return (
                <div style={{ background: '#14141f', border: '1px solid #25253a', borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ color: MODEL_COLORS[d.model] ?? '#e8e8f0', fontWeight: 600, marginBottom: 4 }}>{d.model}</p>
                  <p style={{ color: '#e8e8f0', fontSize: 11 }}>Novelty: {d.novelty.toFixed(1)}</p>
                  <p style={{ color: '#e8e8f0', fontSize: 11 }}>Diversity: {d.diversity.toFixed(3)}</p>
                  <p style={{ color: '#e8e8f0', fontSize: 11 }}>Coverage: {(d.coverage * 100).toFixed(1)}%</p>
                </div>
              )
            }}
          />
          <Scatter data={data} isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={i} fill={MODEL_COLORS[d.model] ?? '#888'} fillOpacity={0.85} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-2 justify-center">
        {data.map((d) => (
          <div key={d.model} className="flex items-center gap-1.5 text-xs" style={{ color: MODEL_COLORS[d.model] }}>
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: MODEL_COLORS[d.model] }} />
            {d.model}
          </div>
        ))}
      </div>
      <p className="text-center text-xs mt-1" style={{ color: '#6b6b8a' }}>Bubble size ∝ Catalog Coverage</p>
    </div>
  )
}
