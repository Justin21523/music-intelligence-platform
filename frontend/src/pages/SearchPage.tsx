import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearch } from '@/hooks/useSearch'
import { useUIStore } from '@/store/uiStore'
import { Card, PageTitle, Input, Button, Spinner, EmptyState, ScoreBar, Badge } from '@/components/ui/index'
import { genreColor } from '@/lib/utils'
import type { SearchMode } from '@/types/api'
import { useTourAnchor } from '@/hooks/useTourAnchor'
import { browseTracks } from '@/api/endpoints'
import type { BrowseTrack } from '@/api/endpoints'
import { useT } from '@/hooks/useT'

const MODES: { value: SearchMode; label: string; desc: string }[] = [
  { value: 'bm25', label: 'BM25', desc: 'Keyword' },
  { value: 'vector', label: 'Vector', desc: 'Semantic' },
  { value: 'hybrid', label: 'Hybrid', desc: 'RRF fusion' },
]

const SORT_OPTION_KEYS = [
  { value: 'play_count', key: 'search.sort_play_count' },
  { value: 'release_year', key: 'search.sort_year' },
  { value: 'energy', key: null, label: 'Energy' },
  { value: 'danceability', key: null, label: 'Danceability' },
  { value: 'title', key: 'search.sort_title' },
]

const TOP_GENRES_LIMIT = 12

/* ── Mini energy / value bar ─────────────────────────── */
function MiniBar({ value, color = '#ff6b35' }: { value: number; color?: string }) {
  const pct = Math.round(Math.min(100, value * 100))
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 rounded-full flex-1" style={{ background: '#25253a', minWidth: 48 }}>
        <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs tabular-nums" style={{ color: '#6b6b8a', minWidth: 28 }}>
        {value.toFixed(2)}
      </span>
    </div>
  )
}

/* ── Section label inside filter panel ───────────────── */
function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div
        className="text-xs font-semibold uppercase tracking-widest mb-2"
        style={{ color: '#6b6b8a' }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

/* ── Browse track card row ───────────────────────────── */
function BrowseTrackRow({ track, rank }: { track: BrowseTrack; rank: number }) {
  return (
    <Card className="flex items-start gap-4 py-3">
      <span className="text-xs w-6 text-right font-mono mt-0.5 shrink-0" style={{ color: '#6b6b8a' }}>
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate mb-0.5" style={{ color: '#e8e8f0' }}>
          {track.title ?? track.track_id}
        </div>
        <div className="text-xs truncate mb-1.5" style={{ color: '#6b6b8a' }}>
          {track.artist_name ?? '—'}
          {track.genre ? ` · ${track.genre}` : ''}
          {track.release_year ? ` · ${track.release_year}` : ''}
          {' · '}
          {track.play_count.toLocaleString()} plays
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1 text-xs" style={{ color: '#6b6b8a' }}>
            <span style={{ minWidth: 44 }}>Energy</span>
            <MiniBar value={track.energy} color="#ff6b35" />
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: '#6b6b8a' }}>
            <span style={{ minWidth: 44 }}>Dance</span>
            <MiniBar value={track.danceability} color="#6b9bff" />
          </div>
        </div>
      </div>
      {track.genre && <Badge color={genreColor(track.genre)}>{track.genre}</Badge>}
    </Card>
  )
}

export function SearchPage() {
  const t = useT()
  const { searchMode, setSearchMode } = useUIStore()
  useTourAnchor(['search-input', 'facet-panel'])

  // ── Filter state ──────────────────────────────────────
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [yearMin, setYearMin] = useState(1960)
  const [yearMax, setYearMax] = useState(2025)
  const [energyMin, setEnergyMin] = useState(0.0)
  const [energyMax, setEnergyMax] = useState(1.0)
  const [explicit, setExplicit] = useState<boolean | null>(null)
  const [sortBy, setSortBy] = useState('play_count')

  // ── Debounced browse params (300 ms) ──────────────────
  const [debouncedFilters, setDebouncedFilters] = useState({
    genre: selectedGenre ?? undefined,
    year_min: yearMin,
    year_max: yearMax,
    energy_min: energyMin,
    energy_max: energyMax,
    explicit: explicit ?? undefined,
    sort_by: sortBy,
    limit: 50,
  })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedFilters({
        genre: selectedGenre ?? undefined,
        year_min: yearMin,
        year_max: yearMax,
        energy_min: energyMin,
        energy_max: energyMax,
        explicit: explicit ?? undefined,
        sort_by: sortBy,
        limit: 50,
      })
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [selectedGenre, yearMin, yearMax, energyMin, energyMax, explicit, sortBy])

  // ── Browse query (no search text) ────────────────────
  const { data: browseData, isLoading: browseLoading } = useQuery({
    queryKey: [
      'browse-tracks',
      debouncedFilters.genre,
      debouncedFilters.year_min,
      debouncedFilters.year_max,
      debouncedFilters.energy_min,
      debouncedFilters.energy_max,
      debouncedFilters.explicit,
      debouncedFilters.sort_by,
    ],
    queryFn: () => browseTracks(debouncedFilters),
    staleTime: 30_000,
  })

  // ── Genre counts from unfiltered browse (first load) ─
  const { data: baseData } = useQuery({
    queryKey: ['browse-tracks-base'],
    queryFn: () => browseTracks({ limit: 1 }),
    staleTime: 300_000,
  })

  // ── Text search query ─────────────────────────────────
  const { data: searchData, isLoading: searchLoading } = useSearch(submitted, searchMode, 50)

  const handleSearch = () => setSubmitted(query.trim())

  const resetFilters = () => {
    setSelectedGenre(null)
    setYearMin(1960)
    setYearMax(2025)
    setEnergyMin(0.0)
    setEnergyMax(1.0)
    setExplicit(null)
    setSortBy('play_count')
  }

  // ── Derived: top genres ───────────────────────────────
  const genreCounts: Record<string, number> = baseData?.genre_counts ?? {}
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_GENRES_LIMIT)

  // ── Client-side filter for search results ─────────────
  const filteredSearchResults = searchData?.results.filter((r) => {
    if (selectedGenre && r.genre !== selectedGenre) return false
    return true
  }) ?? []

  const isSearchMode = submitted.length > 0
  const isLoading = isSearchMode ? searchLoading : browseLoading

  const totalCount = isSearchMode
    ? filteredSearchResults.length
    : browseData?.total ?? 0

  const hasFilters =
    selectedGenre !== null ||
    yearMin !== 1960 ||
    yearMax !== 2025 ||
    energyMin !== 0.0 ||
    energyMax !== 1.0 ||
    explicit !== null ||
    sortBy !== 'play_count'

  return (
    <div>
      <PageTitle
        title={t('page.search.title')}
        subtitle={t('page.search.subtitle')}
      />

      <div className="flex gap-6 items-start">
        {/* ── Left: Facet Filter Panel ──────────────────── */}
        <div
          data-tour-anchor="facet-panel"
          className="shrink-0 rounded-lg border p-4"
          style={{
            width: 240,
            background: '#13131f',
            borderColor: '#25253a',
          }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#e8e8f0' }}>
              {t('search.filters_panel')}
            </span>
            {hasFilters && (
              <button
                onClick={resetFilters}
                className="text-xs transition-opacity hover:opacity-80"
                style={{ color: '#ff6b35' }}
              >
                {t('search.reset')}
              </button>
            )}
          </div>

          {/* Genre pills */}
          <FilterSection label={t('search.genre')}>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedGenre(null)}
                className="px-2 py-0.5 rounded text-xs transition-colors"
                style={{
                  background: selectedGenre === null ? '#ff6b35' : 'transparent',
                  color: selectedGenre === null ? '#0d0d14' : '#6b6b8a',
                  border: `1px solid ${selectedGenre === null ? '#ff6b35' : '#25253a'}`,
                  fontWeight: selectedGenre === null ? 600 : 400,
                }}
              >
                {t('search.all_genres')}
              </button>
              {topGenres.map(([genre, count]) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
                  className="px-2 py-0.5 rounded text-xs transition-colors"
                  style={{
                    background: selectedGenre === genre ? '#ff6b35' : 'transparent',
                    color: selectedGenre === genre ? '#0d0d14' : '#6b6b8a',
                    border: `1px solid ${selectedGenre === genre ? '#ff6b35' : '#25253a'}`,
                    fontWeight: selectedGenre === genre ? 600 : 400,
                  }}
                >
                  {genre}{' '}
                  <span style={{ opacity: 0.65, fontSize: 10 }}>{count}</span>
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Divider */}
          <div className="mb-4" style={{ borderTop: '1px solid #25253a' }} />

          {/* Year range */}
          <FilterSection label={`Year  ${yearMin} – ${yearMax}`}>
            <div className="space-y-1">
              <input
                type="range"
                min={1960}
                max={2025}
                value={yearMin}
                onChange={(e) => setYearMin(Math.min(+e.target.value, yearMax - 1))}
                className="w-full accent-[#ff6b35]"
              />
              <input
                type="range"
                min={1960}
                max={2025}
                value={yearMax}
                onChange={(e) => setYearMax(Math.max(+e.target.value, yearMin + 1))}
                className="w-full accent-[#ff6b35]"
              />
            </div>
          </FilterSection>

          {/* Divider */}
          <div className="mb-4" style={{ borderTop: '1px solid #25253a' }} />

          {/* Energy range */}
          <FilterSection label={`Energy  ${energyMin.toFixed(2)} – ${energyMax.toFixed(2)}`}>
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={energyMin}
                onChange={(e) => setEnergyMin(Math.min(+e.target.value, energyMax - 0.05))}
                className="w-full accent-[#ff6b35]"
              />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={energyMax}
                onChange={(e) => setEnergyMax(Math.max(+e.target.value, energyMin + 0.05))}
                className="w-full accent-[#ff6b35]"
              />
            </div>
          </FilterSection>

          {/* Divider */}
          <div className="mb-4" style={{ borderTop: '1px solid #25253a' }} />

          {/* Sort by */}
          <FilterSection label={t('search.sort')}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-md border px-2 py-1.5 text-xs outline-none cursor-pointer"
              style={{ background: '#1a1a2e', borderColor: '#25253a', color: '#e8e8f0' }}
            >
              {SORT_OPTION_KEYS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.key ? t(o.key) : o.label}
                </option>
              ))}
            </select>
          </FilterSection>

          {/* Divider */}
          <div className="mb-4" style={{ borderTop: '1px solid #25253a' }} />

          {/* Explicit */}
          <FilterSection label={t('search.explicit_filter')}>
            <div className="flex rounded overflow-hidden border" style={{ borderColor: '#25253a' }}>
              {([null, true, false] as (boolean | null)[]).map((val, i) => {
                const label = val === null ? 'ALL' : val ? 'YES' : 'NO'
                const active = explicit === val
                return (
                  <button
                    key={i}
                    onClick={() => setExplicit(val)}
                    className="flex-1 py-1 text-xs font-medium transition-colors"
                    style={{
                      background: active ? '#ff6b35' : 'transparent',
                      color: active ? '#0d0d14' : '#6b6b8a',
                      borderRight: i < 2 ? '1px solid #25253a' : 'none',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </FilterSection>
        </div>

        {/* ── Right: Search bar + Results ───────────────── */}
        <div className="flex-1 min-w-0">
          {/* Search bar + mode toggle */}
          <div data-tour-anchor="search-input">
            <Card className="mb-4">
              <div className="flex gap-3 mb-3">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tracks, artists, genres…"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch}>Search</Button>
                {submitted && (
                  <Button
                    variant="ghost"
                    onClick={() => { setQuery(''); setSubmitted('') }}
                  >
                    Clear
                  </Button>
                )}
              </div>

              <div className="flex gap-2 items-center">
                {MODES.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setSearchMode(value)}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: searchMode === value ? 600 : 400,
                      background: searchMode === value ? '#ff6b35' : '#1a1a2e',
                      color: searchMode === value ? '#0d0d14' : '#6b6b8a',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}{' '}
                    <span style={{ fontSize: 11, opacity: 0.7 }}>({desc})</span>
                  </button>
                ))}

                <span className="ml-auto text-xs" style={{ color: '#6b6b8a' }}>
                  {isLoading ? (
                    <Spinner size={14} />
                  ) : (
                    <>
                      {totalCount.toLocaleString()} track{totalCount !== 1 ? 's' : ''}
                      {isSearchMode && ' matched'}
                    </>
                  )}
                </span>
              </div>
            </Card>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <Spinner size={28} />
            </div>
          )}

          {/* Search results */}
          {!isLoading && isSearchMode && (
            <>
              {filteredSearchResults.length === 0 ? (
                <EmptyState
                  message={`No results for "${submitted}"${selectedGenre ? ` in ${selectedGenre}` : ''}`}
                />
              ) : (
                <div className="space-y-2">
                  {filteredSearchResults.map((r, i) => (
                    <Card key={r.track_id} className="flex items-center gap-4 py-3">
                      <span className="text-xs w-6 text-right font-mono" style={{ color: '#6b6b8a' }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: '#e8e8f0' }}>
                          {r.title ?? r.track_id}
                        </div>
                        <div className="text-xs truncate" style={{ color: '#6b6b8a' }}>
                          {r.artist_name ?? '—'}{r.album ? ` · ${r.album}` : ''}
                        </div>
                      </div>
                      {r.genre && <Badge color={genreColor(r.genre)}>{r.genre}</Badge>}
                      <div className="w-32 shrink-0">
                        <ScoreBar
                          score={r.score}
                          max={Math.max(...filteredSearchResults.map((x) => x.score))}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Browse results (no search query) */}
          {!isLoading && !isSearchMode && (
            <>
              {!browseData || browseData.tracks.length === 0 ? (
                <EmptyState message="No tracks match the current filters" />
              ) : (
                <div className="space-y-2">
                  {browseData.tracks.map((track, i) => (
                    <BrowseTrackRow key={track.track_id} track={track} rank={i + 1} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
