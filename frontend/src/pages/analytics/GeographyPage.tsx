import { Card, PageTitle, Spinner, EmptyState, Badge } from '@/components/ui/index'
import { useT } from '@/hooks/useT'
import { useGeography } from '@/hooks/useAnalytics'
import { useTourAnchor } from '@/hooks/useTourAnchor'
import type { GeographyCountry } from '@/api/endpoints'
import { rankColor } from '@/utils/colorScale'

function HorizontalBars({ countries }: { countries: GeographyCountry[] }) {
  const maxCount = Math.max(...countries.map((c) => c.artist_count), 1)

  return (
    <div className="space-y-2">
      {countries.map((c, i) => {
        const widthPct = (c.artist_count / maxCount) * 100
        const color = rankColor(i)
        return (
          <div key={c.country} className="flex items-center gap-3">
            <div
              className="text-xs text-right shrink-0 flex items-center justify-end gap-1.5"
              style={{ color: '#e8e8f0', width: 128, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              title={c.country}
            >
              <span
                style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }}
              />
              {c.country}
            </div>
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <div
                style={{
                  width: `${widthPct}%`,
                  minWidth: 4,
                  height: 20,
                  background: color,
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                  flexShrink: 0,
                }}
              />
              <span className="text-xs shrink-0" style={{ color: '#6b6b8a' }}>
                {c.artist_count.toLocaleString()}
              </span>
              <span className="text-xs shrink-0 truncate" style={{ color: '#6b6b8a' }}>
                · {c.top_genre}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TopCountryCard({ country }: { country: GeographyCountry }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: '#13131f', border: '1px solid #25253a' }}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>
          {country.country}
        </h4>
        <Badge color="#ff6b35">{country.top_genre}</Badge>
      </div>
      <div className="space-y-1 text-xs mb-3">
        <div className="flex justify-between">
          <span style={{ color: '#6b6b8a' }}>Artists</span>
          <span style={{ color: '#e8e8f0' }}>{country.artist_count.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: '#6b6b8a' }}>Avg Popularity</span>
          <span style={{ color: '#e8e8f0' }}>{country.avg_popularity.toFixed(1)}</span>
        </div>
      </div>
      <div>
        <p className="text-xs mb-1.5" style={{ color: '#6b6b8a' }}>Top Artists</p>
        <div className="flex flex-wrap gap-1">
          {country.top_artists.slice(0, 5).map((a) => (
            <span
              key={a}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: '#25253a', color: '#e8e8f0' }}
            >
              {a}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function GeographyPage() {
  const t = useT()
  useTourAnchor(['geography-chart'])
  const { data, isLoading } = useGeography()

  const countries = data?.countries ?? []
  const sorted = [...countries].sort((a, b) => b.artist_count - a.artist_count)
  const top3 = sorted.slice(0, 3)

  return (
    <div>
      <PageTitle
        title={t('page.geography.title')}
        subtitle={data ? `${countries.length} countries in catalog` : t('page.geography.subtitle')}
      />

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={28} />
        </div>
      )}

      {!isLoading && data && countries.length > 0 && (
        <div className="space-y-6">
          {/* Horizontal bar chart */}
          <Card>
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#e8e8f0' }}>
              Artists by Country
            </h3>
            <p className="text-xs mb-4" style={{ color: '#6b6b8a' }}>
              Bar width proportional to number of artists from that country
            </p>
            <div data-tour-anchor="geography-chart">
              <HorizontalBars countries={sorted} />
            </div>
          </Card>

          {/* Top 3 country cards */}
          {top3.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#e8e8f0' }}>
                Top 3 Countries
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {top3.map((c) => (
                  <TopCountryCard key={c.country} country={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!isLoading && (!data || countries.length === 0) && (
        <EmptyState message="No geography data available — run the pipeline to populate artist metadata." />
      )}
    </div>
  )
}
