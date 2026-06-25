import { useStats } from '@/hooks/useStats'
import { Card, PageTitle, Spinner } from '@/components/ui/index'
import { useT } from '@/hooks/useT'
import { GenrePie } from '@/components/charts/GenrePie'
import { AudioScatter } from '@/components/charts/AudioScatter'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { genreColor } from '@/lib/utils'
import { useTourAnchor } from '@/hooks/useTourAnchor'
import { InsightPanel } from '@/components/ui/index'

export function GenreDashboardPage() {
  const t = useT()
  const { data, isLoading } = useStats()
  useTourAnchor(['genre-pie', 'audio-scatter'])

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>
  if (!data?.genres?.length) return (
    <div className="py-20 text-center text-sm" style={{ color: '#6b6b8a' }}>No genre data</div>
  )

  const genres = data.genres

  return (
    <div>
      <PageTitle title={t('page.genres.title')} subtitle={t('page.genres.subtitle')} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pie chart */}
        <div data-tour-anchor="genre-pie">
        <Card>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#e8e8f0' }}>Track Count by Genre</h2>
          <GenrePie genres={genres} />
        </Card>
        </div>

        {/* Avg plays bar */}
        <Card>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#e8e8f0' }}>Avg Play Count by Genre</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={genres.slice(0, 12).map((g) => ({ genre: g.genre, plays: g.avg_plays }))}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 60, bottom: 0 }}
            >
              <CartesianGrid stroke="#25253a" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#6b6b8a', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="genre" tick={{ fill: '#6b6b8a', fontSize: 11 }} width={56} />
              <Tooltip
                contentStyle={{ background: '#14141f', border: '1px solid #25253a', borderRadius: 6 }}
                itemStyle={{ color: '#6b6b8a' }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [(v as number).toLocaleString(), 'Avg Plays']}
              />
              <Bar dataKey="plays" radius={[0, 3, 3, 0]} maxBarSize={20}>
                {genres.slice(0, 12).map((g) => (
                  <Cell key={g.genre} fill={genreColor(g.genre)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Scatter */}
      <div data-tour-anchor="audio-scatter">
      <Card>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#e8e8f0' }}>
          Energy × Danceability by Genre
        </h2>
        <AudioScatter genres={genres} />
        <p className="text-xs mt-2" style={{ color: '#6b6b8a' }}>
          Each dot = one genre · Position shows avg energy (x) and avg danceability (y)
        </p>
        <InsightPanel>
          <span style={{ color: '#e8e8f0' }}>How to read this:</span>{' '}
          Electronic and Hip-Hop cluster high energy + high danceability (top-right). Classical and Jazz sit low on both axes (bottom-left).
          Genre distance in this chart reflects audio similarity — nearby genres sound alike in feature space.
        </InsightPanel>
      </Card>
      </div>
    </div>
  )
}
