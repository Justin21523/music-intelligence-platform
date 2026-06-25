import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { GenreStat } from '@/types/api'
import { genreColor } from '@/lib/utils'

export function GenrePie({ genres }: { genres: GenreStat[] }) {
  const data = genres.slice(0, 12)
  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="genre"
          cx="50%"
          cy="45%"
          outerRadius={110}
          innerRadius={50}
          strokeWidth={2}
          stroke="#0d0d14"
        >
          {data.map((d) => (
            <Cell key={d.genre} fill={genreColor(d.genre)} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#14141f', border: '1px solid #25253a', borderRadius: 6 }}
          labelStyle={{ color: '#e8e8f0' }}
          itemStyle={{ color: '#6b6b8a' }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => [(v as number).toLocaleString(), 'Tracks']}
        />
        <Legend
          formatter={(v) => <span style={{ color: '#6b6b8a', fontSize: 12 }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
