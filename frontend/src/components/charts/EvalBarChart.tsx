import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import type { EvalRow } from '@/types/api'

const MODEL_COLORS: Record<string, string> = {
  popularity: '#ff6b35',
  item_similarity: '#f7c59f',
  als: '#22d3ee',
  content: '#a78bfa',
  hybrid: '#34d399',
}

const MODELS_ORDER = ['popularity', 'item_similarity', 'als', 'content', 'hybrid']

interface Props {
  rows: EvalRow[]
}

function MiniBarChart({
  data,
  dataKey,
  label,
  formatter,
  domain,
}: {
  data: Array<Record<string, number | string>>
  dataKey: string
  label: string
  formatter: (v: number) => string
  domain: [number, number]
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <p className="text-xs font-medium mb-2 text-center" style={{ color: '#e8e8f0' }}>{label}</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 5 }}>
          <CartesianGrid stroke="#25253a" strokeDasharray="3 3" />
          <XAxis dataKey="model" tick={{ fill: '#6b6b8a', fontSize: 10 }} />
          <YAxis
            tick={{ fill: '#6b6b8a', fontSize: 10 }}
            domain={domain}
            tickFormatter={formatter}
            width={38}
          />
          <Tooltip
            contentStyle={{ background: '#14141f', border: '1px solid #25253a', borderRadius: 6 }}
            labelStyle={{ color: '#e8e8f0', fontSize: 11 }}
            itemStyle={{ color: '#e8e8f0', fontSize: 11 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any) => [formatter(v as number), label]}
          />
          <Bar dataKey={dataKey} radius={[3, 3, 0, 0]} maxBarSize={32}>
            {data.map((d) => (
              <Cell key={d.model as string} fill={MODEL_COLORS[d.model as string] ?? '#888'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function EvalBarChart({ rows }: Props) {
  const k10Rows = rows.filter((r) => Number(r.k ?? 10) === 10 || !('k' in r))

  const byModel = MODELS_ORDER
    .map((m) => {
      const row = k10Rows.find((r) => String(r.model) === m) ?? rows.find((r) => String(r.model) === m)
      return {
        model: m,
        coverage_pct: Number(row?.coverage ?? 0) * 100,
        novelty: Number(row?.novelty ?? 0),
        diversity: Number(row?.diversity ?? 0),
      }
    })
    .filter((d) => rows.some((r) => String(r.model) === d.model))

  if (!byModel.length) return null

  const maxCov = Math.max(20, Math.ceil(Math.max(...byModel.map((d) => d.coverage_pct)) * 1.15))

  return (
    <div className="space-y-4">
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4 }}>
        <MiniBarChart
          data={byModel}
          dataKey="coverage_pct"
          label="Catalog Coverage (%)"
          formatter={(v) => `${v.toFixed(1)}%`}
          domain={[0, maxCov]}
        />
        <MiniBarChart
          data={byModel}
          dataKey="novelty"
          label="Novelty Score"
          formatter={(v) => v.toFixed(1)}
          domain={[0, 22]}
        />
        <MiniBarChart
          data={byModel}
          dataKey="diversity"
          label="Diversity Score"
          formatter={(v) => v.toFixed(3)}
          domain={[0, 0.30]}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center pt-1">
        {byModel.map((d) => (
          <div key={d.model} className="flex items-center gap-1.5 text-xs" style={{ color: MODEL_COLORS[d.model] ?? '#888' }}>
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: MODEL_COLORS[d.model] ?? '#888' }} />
            {d.model}
          </div>
        ))}
      </div>
    </div>
  )
}
