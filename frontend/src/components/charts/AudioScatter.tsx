import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import type { GenreStat } from '@/types/api'
import { genreColor } from '@/lib/utils'

interface DotPoint {
  name: string
  energy: number
  danceability: number
  valence: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomDot(props: any) {
  const { cx, cy, payload } = props as { cx: number; cy: number; payload: DotPoint }
  const color = genreColor(payload.name)
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill={color} fillOpacity={0.85} stroke={color} strokeWidth={1} />
      <text
        x={cx + 9}
        y={cy + 4}
        fontSize={10}
        fill="#9b9bb8"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {payload.name}
      </text>
    </g>
  )
}

export function AudioScatter({ genres }: { genres: GenreStat[] }) {
  const data: DotPoint[] = genres.map((g) => ({
    name: g.genre,
    energy: Math.round(g.avg_energy * 100),
    danceability: Math.round(g.avg_danceability * 100),
    valence: Math.round(g.avg_valence * 100),
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ top: 10, right: 80, bottom: 30, left: 20 }}>
        <CartesianGrid stroke="#25253a" strokeDasharray="3 3" />
        <XAxis
          type="number" dataKey="energy" name="Energy (%)"
          label={{ value: 'Energy %', position: 'insideBottom', offset: -10, fill: '#6b6b8a', fontSize: 12 }}
          tick={{ fill: '#6b6b8a', fontSize: 11 }}
          domain={[0, 100]}
        />
        <YAxis
          type="number" dataKey="danceability" name="Danceability (%)"
          label={{ value: 'Dance %', angle: -90, position: 'insideLeft', fill: '#6b6b8a', fontSize: 12 }}
          tick={{ fill: '#6b6b8a', fontSize: 11 }}
          domain={[0, 100]}
        />
        <Tooltip
          cursor={{ stroke: '#25253a' }}
          contentStyle={{ background: '#14141f', border: '1px solid #25253a', borderRadius: 6 }}
          content={({ payload }) => {
            if (!payload?.length) return null
            const d = payload[0]?.payload as DotPoint
            return (
              <div style={{ background: '#14141f', border: '1px solid #25253a', borderRadius: 6, padding: '8px 12px' }}>
                <p style={{ color: genreColor(d.name), fontWeight: 600, marginBottom: 4 }}>{d.name}</p>
                <p style={{ color: '#6b6b8a', fontSize: 12 }}>Energy: {d.energy}%</p>
                <p style={{ color: '#6b6b8a', fontSize: 12 }}>Dance: {d.danceability}%</p>
                <p style={{ color: '#6b6b8a', fontSize: 12 }}>Valence: {d.valence}%</p>
              </div>
            )
          }}
        />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Scatter data={data} name="Genres" shape={(props: any) => <CustomDot {...props} />} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
