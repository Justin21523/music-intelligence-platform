import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import type { AudioProfile } from '@/types/api'

const AXES = [
  { key: 'energy', label: 'Energy' },
  { key: 'danceability', label: 'Dance' },
  { key: 'valence', label: 'Valence' },
  { key: 'acousticness', label: 'Acoustic' },
  { key: 'tempo_norm', label: 'Tempo' },
] as const

interface Props {
  listenProfile: AudioProfile
  recProfile: AudioProfile
  model: string
}

export function UserDnaRadar({ listenProfile, recProfile, model }: Props) {
  const data = AXES.map(({ key, label }) => ({
    axis: label,
    listen: Math.round(listenProfile[key] * 100),
    rec: Math.round(recProfile[key] * 100),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="#25253a" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: '#6b6b8a', fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6b6b8a', fontSize: 10 }} />
        <Radar
          name="Your Taste"
          dataKey="listen"
          stroke="#ff6b35"
          fill="#ff6b35"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Radar
          name={`${model} Recs`}
          dataKey="rec"
          stroke="#22d3ee"
          fill="#22d3ee"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{ background: '#14141f', border: '1px solid #25253a', borderRadius: 8 }}
          labelStyle={{ color: '#e8e8f0' }}
          itemStyle={{ color: '#e8e8f0' }}
          formatter={(v: any) => [`${v}%`]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#6b6b8a' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
