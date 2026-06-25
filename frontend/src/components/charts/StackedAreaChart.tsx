import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMemo } from 'react'
import { GENRE_COLORS } from '@/lib/utils'

// Fallback colors for genres not in GENRE_COLORS
const EXTRA_COLORS = [
  '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4',
  '#10b981', '#f97316', '#6366f1', '#84cc16',
  '#94a3b8',
]

interface Props {
  years: number[]
  genres: string[]
  matrix: Record<string, number[]>
}

export function StackedAreaChart({ years, genres, matrix }: Props) {
  const data = useMemo(() =>
    years.map((year, i) => {
      const point: Record<string, number | string> = { year }
      genres.forEach((g) => {
        point[g] = matrix[g]?.[i] ?? 0
      })
      return point
    }),
    [years, genres, matrix],
  )

  const colorFor = (genre: string, idx: number): string =>
    GENRE_COLORS[genre] ?? EXTRA_COLORS[idx % EXTRA_COLORS.length]

  return (
    <ResponsiveContainer width="100%" height={360}>
      <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#25253a" />
        <XAxis
          dataKey="year"
          tick={{ fill: '#6b6b8a', fontSize: 11 }}
          label={{ value: 'Release Year', position: 'insideBottom', offset: -15, fill: '#6b6b8a', fontSize: 12 }}
        />
        <YAxis
          tick={{ fill: '#6b6b8a', fontSize: 11 }}
          label={{ value: 'Tracks', angle: -90, position: 'insideLeft', fill: '#6b6b8a', fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{ background: '#14141f', border: '1px solid #25253a', borderRadius: 8 }}
          labelStyle={{ color: '#e8e8f0' }}
          itemStyle={{ color: '#e8e8f0', fontSize: 11 }}
        />
        {genres.map((genre, idx) => (
          <Area
            key={genre}
            type="monotone"
            dataKey={genre}
            stackId="1"
            stroke={colorFor(genre, idx)}
            fill={colorFor(genre, idx)}
            fillOpacity={0.75}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
