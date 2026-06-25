import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts'
import type { TrackDetail } from '@/types/api'

const FEATURES = [
  { key: 'energy', label: 'Energy' },
  { key: 'danceability', label: 'Dance' },
  { key: 'valence', label: 'Valence' },
  { key: 'acousticness', label: 'Acoustic' },
] as const

type FeatureKey = typeof FEATURES[number]['key']

export function AudioRadar({ track }: { track: TrackDetail }) {
  const data = FEATURES.map(({ key, label }) => ({
    feature: label,
    value: Math.round(((track[key as FeatureKey] ?? 0) * 100)),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data}>
        <PolarGrid stroke="#25253a" />
        <PolarAngleAxis dataKey="feature" tick={{ fill: '#6b6b8a', fontSize: 11 }} />
        <Radar
          dataKey="value"
          stroke="#ff6b35"
          fill="#ff6b35"
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
