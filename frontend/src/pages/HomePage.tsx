import { useNavigate } from 'react-router-dom'
import { useStats } from '@/hooks/useStats'
import { usePipelineStatus } from '@/hooks/usePipelineStatus'
import { Card, PageTitle, Spinner, Badge } from '@/components/ui/index'
import { useT } from '@/hooks/useT'
import { fmtCount, genreColor } from '@/lib/utils'
import { Music, Users, Radio, Headphones, Play, CheckCircle, Loader, ArrowRight } from 'lucide-react'
import { useTourAnchor } from '@/hooks/useTourAnchor'
import { useTourStore } from '@/store/tourStore'

function PipelineCTA() {
  const navigate = useNavigate()
  const tourStore = useTourStore()
  const { data: pStatus } = usePipelineStatus()
  const status = pStatus?.status

  const startJourney = () => {
    tourStore.setActive(true)
    tourStore.setStep(0)
    tourStore.setMinimized(false)
  }

  return (
    <div
      className="mb-8 rounded-lg p-4"
      style={{
        borderLeft: '4px solid #ff6b35',
        background: 'rgba(255,107,53,0.05)',
        border: '1px solid rgba(255,107,53,0.2)',
        borderLeftWidth: '4px',
      }}
    >
      {(!status || status === 'idle') && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#e8e8f0' }}>
              Start Here — Run the ML Pipeline
            </p>
            <div className="flex items-center gap-2 text-xs" style={{ color: '#6b6b8a' }}>
              <span>Upload Data</span>
              <ArrowRight size={11} />
              <span>Train Models</span>
              <ArrowRight size={11} />
              <span>Explore Results</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/upload')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#ff6b35', color: '#0d0d14' }}
            >
              <Play size={14} />
              Run Pipeline
            </button>
            <button
              onClick={startJourney}
              className="text-xs px-3 py-2 rounded-lg"
              style={{ background: 'rgba(255,107,53,0.1)', color: '#ff6b35', border: '1px solid rgba(255,107,53,0.3)' }}
            >
              View Journey
            </button>
          </div>
        </div>
      )}

      {status === 'running' && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Loader size={18} style={{ color: '#ff6b35' }} className="animate-spin" />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>Pipeline Running…</p>
              <p className="text-xs" style={{ color: '#6b6b8a' }}>{pStatus?.step_name}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="text-xs px-3 py-2 rounded-lg flex items-center gap-1.5"
            style={{ background: 'rgba(255,107,53,0.1)', color: '#ff6b35', border: '1px solid rgba(255,107,53,0.3)' }}
          >
            View Progress <ArrowRight size={12} />
          </button>
        </div>
      )}

      {status === 'done' && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle size={18} style={{ color: '#34d399' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>
                Pipeline Ready — explore the results below
              </p>
              <p className="text-xs" style={{ color: '#6b6b8a' }}>
                Completed in {pStatus?.elapsed_s}s · {pStatus?.used_sample ? 'sample data' : 'custom data'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => navigate('/recommend')} className="text-xs px-3 py-1.5 rounded" style={{ background: 'rgba(255,107,53,0.1)', color: '#ff6b35', border: '1px solid rgba(255,107,53,0.2)' }}>Recommendations</button>
            <button onClick={() => navigate('/evaluation')} className="text-xs px-3 py-1.5 rounded" style={{ background: 'rgba(255,107,53,0.1)', color: '#ff6b35', border: '1px solid rgba(255,107,53,0.2)' }}>Evaluation</button>
            <button onClick={() => navigate('/genres')} className="text-xs px-3 py-1.5 rounded" style={{ background: 'rgba(255,107,53,0.1)', color: '#ff6b35', border: '1px solid rgba(255,107,53,0.2)' }}>Genres</button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm" style={{ color: '#f87171' }}>Pipeline failed — <span style={{ color: '#6b6b8a' }}>{pStatus?.error}</span></p>
          <button onClick={() => navigate('/upload')} className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
            View Error
          </button>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number | undefined; icon: typeof Music; color: string
}) {
  return (
    <Card className="flex items-center gap-4">
      <div className="p-3 rounded-lg" style={{ background: `${color}22` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color: '#e8e8f0' }}>
          {value !== undefined ? fmtCount(value) : '—'}
        </div>
        <div className="text-sm" style={{ color: '#6b6b8a' }}>{label}</div>
      </div>
    </Card>
  )
}

export function HomePage() {
  const t = useT()
  const { data, isLoading, isError } = useStats()
  useTourAnchor(['stats-cards', 'top-tracks'])

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>
  if (isError || !data) {
    return <div className="py-20 text-center text-sm" style={{ color: '#f87171' }}>
      Could not load stats — is the API running on port 8000?
    </div>
  }

  return (
    <div>
      <PageTitle
        title={t('page.home.title')}
        subtitle={t('page.home.subtitle')}
      />

      <PipelineCTA />

      {/* Stats */}
      <div data-tour-anchor="stats-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Tracks" value={data.tracks} icon={Music} color="#ff6b35" />
        <StatCard label="Artists" value={data.artists} icon={Radio} color="#22d3ee" />
        <StatCard label="Users" value={data.users} icon={Users} color="#a78bfa" />
        <StatCard label="Listens" value={data.listens} icon={Headphones} color="#34d399" />
      </div>

      {/* Top tracks + Genre breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top tracks */}
        <div data-tour-anchor="top-tracks">
        <Card>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#e8e8f0' }}>Top Tracks by Play Count</h2>
          <div className="space-y-2">
            {data.top_tracks.map((t, i) => (
              <div key={t.track_id} className="flex items-center gap-3 py-1.5 border-b last:border-0" style={{ borderColor: '#25253a' }}>
                <span className="text-xs w-5 text-right font-mono" style={{ color: '#6b6b8a' }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: '#e8e8f0' }}>{t.title}</div>
                  <div className="text-xs truncate" style={{ color: '#6b6b8a' }}>{t.artist_name}</div>
                </div>
                <Badge color={genreColor(t.genre)}>{t.genre}</Badge>
                <span className="text-xs font-mono" style={{ color: '#ff6b35' }}>{fmtCount(t.play_count)}</span>
              </div>
            ))}
          </div>
        </Card>
        </div>

        {/* Genre breakdown */}
        <Card>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#e8e8f0' }}>Genre Distribution</h2>
          <div className="space-y-2">
            {data.genres.slice(0, 12).map((g) => {
              const maxCount = Math.max(...data.genres.map((x) => x.count))
              const pct = (g.count / maxCount) * 100
              return (
                <div key={g.genre} className="flex items-center gap-3">
                  <span className="text-xs w-20 truncate" style={{ color: '#6b6b8a' }}>{g.genre}</span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: '#25253a' }}>
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${pct}%`, background: genreColor(g.genre) }}
                    />
                  </div>
                  <span className="text-xs w-10 text-right font-mono" style={{ color: '#6b6b8a' }}>
                    {g.count}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
