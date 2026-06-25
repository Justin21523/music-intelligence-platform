import { useNavigate } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { useTourStore } from '@/store/tourStore'
import { useLangStore } from '@/store/langStore'
import { TOUR_STEPS } from '@/data/tourSteps'
import { DataGenAnim }   from './animations/DataGenAnim'
import { CleanAnim }     from './animations/CleanAnim'
import { FeatureAnim }   from './animations/FeatureAnim'
import { CatalogAnim }   from './animations/CatalogAnim'
import { TrainAnim }     from './animations/TrainAnim'
import { SearchAnim }    from './animations/SearchAnim'
import { SimilarAnim }   from './animations/SimilarAnim'
import { RecommendAnim } from './animations/RecommendAnim'
import { EvalAnim }      from './animations/EvalAnim'
import { NetworkAnim }   from './animations/NetworkAnim'
import { SnaAnim }       from './animations/SnaAnim'
import { FacetAnim }     from './animations/FacetAnim'
import { DnaAnim }       from './animations/DnaAnim'
import { DisagreeAnim }  from './animations/DisagreeAnim'
import { PopAnim }       from './animations/PopAnim'
import { TimelineAnim }  from './animations/TimelineAnim'
import { TradeoffAnim }  from './animations/TradeoffAnim'
import { CorrAnim }      from './animations/CorrAnim'
import { PatternsAnim }  from './animations/PatternsAnim'
import { CohortAnim }    from './animations/CohortAnim'
import { GeoAnim }       from './animations/GeoAnim'
import { PipelineAnim }  from './animations/PipelineAnim'

// Must match TOUR_STEPS order (22 entries)
const ANIMATIONS = [
  DataGenAnim, CleanAnim, FeatureAnim, CatalogAnim,
  TrainAnim, SearchAnim, SimilarAnim, RecommendAnim,
  EvalAnim, NetworkAnim, SnaAnim, FacetAnim,
  DnaAnim, DisagreeAnim, PopAnim, TimelineAnim,
  TradeoffAnim, CorrAnim, PatternsAnim, CohortAnim,
  GeoAnim, PipelineAnim,
]

export function TourFullscreen() {
  const navigate = useNavigate()
  const lang = useLangStore((s) => s.lang)
  const {
    isActive, isFullscreen, currentStep,
    setFullscreen, setActive, setStep, setPendingAnchor,
  } = useTourStore()

  if (!isActive || !isFullscreen) return null

  const step = TOUR_STEPS[currentStep]!
  const AnimComponent = ANIMATIONS[currentStep]!
  const isFirst = currentStep === 0
  const isLast  = currentStep === TOUR_STEPS.length - 1
  const progress = Math.round(((currentStep + 1) / TOUR_STEPS.length) * 100)

  const title    = lang === 'zh' && step.titleZh    ? step.titleZh    : step.title
  const subtitle = lang === 'zh' && step.subtitleZh ? step.subtitleZh : step.subtitle
  const desc     = lang === 'zh' && step.descriptionZh ? step.descriptionZh : step.description
  const stats    = lang === 'zh' && step.statsZh    ? step.statsZh    : step.stats

  function handlePrev() { if (!isFirst) setStep(currentStep - 1) }
  function handleNext() { if (!isLast)  setStep(currentStep + 1) }

  function handleGoToPage() {
    // Navigate to the page in the background — tour stays open
    setPendingAnchor(step.anchor)
    navigate(step.route)
  }

  function handleDone() {
    document.querySelectorAll('[data-tour-active]').forEach((el) =>
      el.removeAttribute('data-tour-active')
    )
    setFullscreen(false)
    setActive(false)
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex overflow-hidden"
      style={{ background: 'rgba(13,13,20,0.98)' }}
    >
      {/* ── Left timeline sidebar ───────────────────────────── */}
      <div
        className="shrink-0 flex flex-col overflow-y-auto"
        style={{ width: 260, background: '#14141f', borderRight: '1px solid #25253a' }}
      >
        {/* Sidebar header */}
        <div className="px-5 py-5 border-b shrink-0" style={{ borderColor: '#25253a' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🎵</span>
            <div>
              <p className="text-sm font-bold" style={{ color: '#e8e8f0' }}>Pipeline Journey</p>
              <p className="text-xs" style={{ color: '#6b6b8a' }}>
                {lang === 'zh' ? '互動式導覽' : 'Interactive Tour'}
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ background: '#25253a', borderRadius: 4, height: 4 }}>
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: isLast ? '#22d3ee' : '#ff6b35',
                borderRadius: 4,
                transition: 'width 0.35s ease',
              }}
            />
          </div>
          <p className="text-xs mt-1.5 tabular-nums" style={{ color: '#6b6b8a' }}>
            {lang === 'zh'
              ? `第 ${currentStep + 1} 步 / 共 ${TOUR_STEPS.length} 步 · ${progress}%`
              : `Step ${currentStep + 1} of ${TOUR_STEPS.length} · ${progress}%`}
          </p>
        </div>

        {/* Step list */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {TOUR_STEPS.map((s, i) => {
            const active  = i === currentStep
            const visited = i < currentStep
            const sTitle  = lang === 'zh' && s.titleZh ? s.titleZh : s.title
            const sSub    = lang === 'zh' && s.subtitleZh ? s.subtitleZh : s.subtitle
            return (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className="w-full flex items-start gap-3 px-5 py-2.5 text-left transition-all"
                style={{
                  background: active ? 'rgba(255,107,53,0.1)' : 'transparent',
                  borderRight: active ? '3px solid #ff6b35' : '3px solid transparent',
                }}
              >
                <span
                  className="shrink-0 inline-flex items-center justify-center rounded-full text-xs font-bold mt-0.5"
                  style={{
                    width: 20, height: 20,
                    background: active ? '#ff6b35' : visited ? 'rgba(255,107,53,0.25)' : '#25253a',
                    color: active ? '#0d0d14' : visited ? '#ff6b35' : '#6b6b8a',
                    fontSize: 10,
                  }}
                >
                  {visited && !active ? '✓' : i + 1}
                </span>
                <div className="min-w-0">
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: active ? '#ff6b35' : visited ? '#e8e8f0' : '#6b6b8a' }}
                  >
                    {sTitle}
                  </p>
                  <p className="truncate" style={{ color: '#6b6b8a', fontSize: 10 }}>{sSub}</p>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Locked footer hint */}
        <div
          className="px-5 py-4 border-t text-xs"
          style={{ borderColor: '#25253a', color: '#6b6b8a' }}
        >
          {lang === 'zh'
            ? '📌 瀏覽完所有步驟後即可進入平台'
            : '📌 Explore all steps to enter the platform'}
        </div>
      </div>

      {/* ── Main content area ───────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar — no close button */}
        <div
          className="flex items-center justify-between px-6 py-3 shrink-0 border-b"
          style={{ borderColor: '#25253a', background: '#14141f' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded"
              style={{ background: 'rgba(255,107,53,0.15)', color: '#ff6b35' }}
            >
              {subtitle}
            </span>
            <span className="text-xs" style={{ color: '#6b6b8a' }}>{title}</span>
          </div>
          {/* Progress pill — no X button */}
          <div
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
            style={{ background: '#25253a', color: '#6b6b8a' }}
          >
            <span
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isLast ? '#22d3ee' : '#ff6b35',
                flexShrink: 0,
                display: 'inline-block',
              }}
            />
            {lang === 'zh' ? `進度 ${progress}%` : `${progress}% complete`}
          </div>
        </div>

        {/* Body: animation + info */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row gap-0">
          {/* Animation panel */}
          <div
            className="shrink-0 flex items-center justify-center"
            style={{
              background: '#0d0d14',
              borderRight: '1px solid #25253a',
              minHeight: 300,
              width: '100%',
              maxWidth: 560,
            }}
          >
            <div key={currentStep} style={{ width: '100%', height: 420, padding: '24px 32px' }}>
              <AnimComponent />
            </div>
          </div>

          {/* Info panel */}
          <div className="flex-1 p-8 overflow-y-auto">
            <p className="text-sm font-semibold mb-1" style={{ color: '#ff6b35' }}>
              {subtitle}
            </p>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#e8e8f0' }}>
              {title}
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#9b9bb8' }}>
              {desc}
            </p>

            {/* Key stats */}
            <div className="space-y-3 mb-8">
              {stats.map((s) => (
                <div key={s} className="flex items-start gap-3">
                  <span
                    className="shrink-0 mt-0.5 inline-flex items-center justify-center rounded-full text-xs font-bold"
                    style={{ width: 18, height: 18, background: 'rgba(255,107,53,0.15)', color: '#ff6b35' }}
                  >
                    ›
                  </span>
                  <span className="text-sm" style={{ color: '#e8e8f0' }}>{s}</span>
                </div>
              ))}
            </div>

            {/* Navigate to page (tour stays open) */}
            <button
              onClick={handleGoToPage}
              className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg font-medium transition-all hover:opacity-90"
              style={{ background: 'rgba(255,107,53,0.08)', color: '#ff6b35', border: '1px solid rgba(255,107,53,0.25)' }}
            >
              <ExternalLink size={14} />
              {lang === 'zh' ? '在背景預覽此頁面' : 'Preview this page'} →
            </button>

            {/* Last step — special finish callout */}
            {isLast && (
              <div
                className="mt-6 p-4 rounded-xl"
                style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.3)' }}
              >
                <p className="text-sm font-semibold mb-1" style={{ color: '#22d3ee' }}>
                  {lang === 'zh' ? '🎉 已完成所有導覽步驟！' : "🎉 You've seen everything!"}
                </p>
                <p className="text-xs" style={{ color: '#6b6b8a' }}>
                  {lang === 'zh'
                    ? '點擊「進入平台」開始探索 Music Intelligence Platform。'
                    : 'Click "Enter Platform" to start exploring the Music Intelligence Platform.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom navigation */}
        <div
          className="shrink-0 flex items-center justify-between px-6 py-4 border-t"
          style={{ borderColor: '#25253a', background: '#14141f' }}
        >
          {/* Progress dots */}
          <div className="flex items-center gap-1 flex-wrap max-w-xs">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === currentStep ? 16 : 5,
                  height: 5,
                  background:
                    i === currentStep
                      ? '#ff6b35'
                      : i < currentStep
                      ? 'rgba(255,107,53,0.4)'
                      : '#25253a',
                }}
              />
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className="text-sm px-4 py-2 rounded-lg transition-all disabled:opacity-25"
              style={{
                background: isFirst ? 'transparent' : 'rgba(255,107,53,0.08)',
                color: '#ff6b35',
                border: '1px solid rgba(255,107,53,0.25)',
              }}
            >
              {lang === 'zh' ? '← 上一步' : '← Prev'}
            </button>

            {isLast ? (
              <button
                onClick={handleDone}
                className="text-sm px-6 py-2 rounded-lg font-bold transition-all hover:opacity-90"
                style={{
                  background: '#22d3ee',
                  color: '#0d0d14',
                  boxShadow: '0 0 20px rgba(34,211,238,0.4)',
                }}
              >
                {lang === 'zh' ? '進入平台 →' : 'Enter Platform →'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="text-sm px-5 py-2 rounded-lg font-semibold transition-all hover:opacity-90"
                style={{ background: '#ff6b35', color: '#0d0d14' }}
              >
                {lang === 'zh' ? '下一步 →' : 'Next →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
