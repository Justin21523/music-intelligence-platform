import { useCatalogTimeline } from '@/hooks/useAnalytics'
import { Card, PageTitle, Spinner, EmptyState, Badge } from '@/components/ui/index'
import { useT } from '@/hooks/useT'
import { StackedAreaChart } from '@/components/charts/StackedAreaChart'
import { GENRE_COLORS } from '@/lib/utils'

const EXTRA_COLORS = [
  '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4',
  '#10b981', '#f97316', '#6366f1', '#84cc16', '#94a3b8',
]

export function CatalogTimelinePage() {
  const t = useT()
  const { data, isLoading } = useCatalogTimeline()

  const colorFor = (genre: string, idx: number): string =>
    GENRE_COLORS[genre] ?? EXTRA_COLORS[idx % EXTRA_COLORS.length]

  return (
    <div>
      <PageTitle
        title={t('page.timeline.title')}
        subtitle={t('page.timeline.subtitle')}
      />

      {isLoading && <div className="flex justify-center py-12"><Spinner size={28} /></div>}

      {data && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#e8e8f0' }}>
              Genre Distribution by Release Year
            </h3>
            <StackedAreaChart
              years={data.years}
              genres={data.genres}
              matrix={data.matrix}
            />

            {/* Genre legend */}
            <div className="flex flex-wrap gap-2 mt-4">
              {data.genres.map((genre, idx) => (
                <Badge key={genre} color={colorFor(genre, idx)}>{genre}</Badge>
              ))}
            </div>
          </Card>

          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <p className="text-xs" style={{ color: '#6b6b8a' }}>Years covered</p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#e8e8f0' }}>
                {data.years[0]} – {data.years[data.years.length - 1]}
              </p>
            </Card>
            <Card>
              <p className="text-xs" style={{ color: '#6b6b8a' }}>Genre segments</p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#e8e8f0' }}>
                {data.genres.length - 1} + Other
              </p>
            </Card>
            <Card>
              <p className="text-xs" style={{ color: '#6b6b8a' }}>Top genre</p>
              <p className="text-2xl font-bold mt-1" style={{ color: colorFor(data.genres[0], 0) }}>
                {data.genres[0]}
              </p>
            </Card>
          </div>
        </div>
      )}

      {!isLoading && !data && (
        <EmptyState message="No timeline data — ensure the API is running" />
      )}
    </div>
  )
}
