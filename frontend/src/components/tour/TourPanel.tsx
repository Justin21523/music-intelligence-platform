import { useNavigate } from 'react-router-dom'
import { Maximize2 } from 'lucide-react'
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

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="inline-block rounded-full transition-all duration-200"
          style={{
            width: i === current ? 14 : 5,
            height: 5,
            background: i === current ? '#ff6b35' : i < current ? 'rgba(255,107,53,0.4)' : '#25253a',
          }}
        />
      ))}
    </div>
  )
}

export function TourPanel() {
  const navigate = useNavigate()
  const lang = useLangStore((s) => s.lang)
  const {
    isActive, isMinimized, currentStep,
    setActive, setMinimized, setFullscreen, setStep, setPendingAnchor,
  } = useTourStore()

  if (!isActive) return null

  const step = TOUR_STEPS[currentStep]!
  const AnimComponent = ANIMATIONS[currentStep]!

  const title    = lang === 'zh' && step.titleZh    ? step.titleZh    : step.title
  const subtitle = lang === 'zh' && step.subtitleZh ? step.subtitleZh : step.subtitle
  const desc     = lang === 'zh' && step.descriptionZh ? step.descriptionZh : step.description
  const stats    = lang === 'zh' && step.statsZh    ? step.statsZh    : step.stats

  function goToStep(n: number) {
    const target = TOUR_STEPS[n]!
    setStep(n)
    setPendingAnchor(target.anchor)
    navigate(target.route)
  }

  function handleNext() {
    const nextIdx = currentStep + 1
    if (nextIdx < TOUR_STEPS.length) goToStep(nextIdx)
  }

  function handlePrev() {
    const prevIdx = currentStep - 1
    if (prevIdx >= 0) goToStep(prevIdx)
  }

  function handleClose() {
    document.querySelectorAll('[data-tour-active]').forEach((el) =>
      el.removeAttribute('data-tour-active')
    )
    localStorage.setItem('mip-journey-v1', '1')
    setActive(false)
  }

  // Minimized pill
  if (isMinimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-xl cursor-pointer"
        style={{ background: '#ff6b35', color: '#0d0d14', boxShadow: '0 4px 24px rgba(255,107,53,0.4)' }}
      >
        ▶ {lang === 'zh' ? 'Journey' : 'Journey'}
        <span className="text-xs opacity-70">{currentStep + 1}/{TOUR_STEPS.length}</span>
      </button>
    )
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 rounded-2xl overflow-hidden shadow-2xl"
      style={{
        width: 320,
        background: '#14141f',
        border: '1px solid #25253a',
        boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,107,53,0.15)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: '#25253a' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🎵</span>
          <span className="text-xs font-semibold" style={{ color: '#e8e8f0' }}>
            Pipeline Journey
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setFullscreen(true); setMinimized(false) }}
            className="w-6 h-6 rounded flex items-center justify-center transition-opacity hover:opacity-100 opacity-50"
            style={{ color: '#6b6b8a' }}
            title={lang === 'zh' ? '全螢幕' : 'Fullscreen'}
          >
            <Maximize2 size={12} />
          </button>
          <button
            onClick={() => setMinimized(true)}
            className="w-6 h-6 rounded flex items-center justify-center text-xs transition-opacity hover:opacity-100 opacity-50"
            style={{ color: '#6b6b8a' }}
            title={lang === 'zh' ? '最小化' : 'Minimize'}
          >
            —
          </button>
          <button
            onClick={handleClose}
            className="w-6 h-6 rounded flex items-center justify-center text-xs transition-opacity hover:opacity-100 opacity-50"
            style={{ color: '#6b6b8a' }}
            title={lang === 'zh' ? '關閉' : 'Close'}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Animation area */}
      <div
        className="border-b"
        style={{ height: 128, background: '#0d0d14', borderColor: '#25253a', padding: '4px 8px' }}
      >
        <div key={currentStep} style={{ height: '100%' }}>
          <AnimComponent />
        </div>
      </div>

      {/* Step info */}
      <div className="px-4 py-3 border-b" style={{ borderColor: '#25253a' }}>
        <div className="flex items-center justify-between mb-2">
          <StepDots total={TOUR_STEPS.length} current={currentStep} />
          <span className="text-xs tabular-nums" style={{ color: '#6b6b8a' }}>
            {currentStep + 1} / {TOUR_STEPS.length}
          </span>
        </div>
        <p className="text-xs font-medium mb-0.5" style={{ color: '#ff6b35' }}>
          {subtitle}
        </p>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#e8e8f0' }}>
          {title}
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: '#6b6b8a' }}>
          {desc}
        </p>
      </div>

      {/* Stats */}
      <div className="px-4 py-2 border-b" style={{ borderColor: '#25253a' }}>
        {stats.map((s) => (
          <div key={s} className="flex items-center gap-1.5 text-xs py-0.5">
            <span style={{ color: '#ff6b35' }}>›</span>
            <span style={{ color: '#e8e8f0' }}>{s}</span>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-30"
          style={{
            background: currentStep > 0 ? 'rgba(255,107,53,0.1)' : 'transparent',
            color: currentStep > 0 ? '#ff6b35' : '#6b6b8a',
            border: '1px solid',
            borderColor: currentStep > 0 ? 'rgba(255,107,53,0.3)' : '#25253a',
          }}
        >
          {lang === 'zh' ? '← 上一步' : '← Back'}
        </button>

        <button
          onClick={() => goToStep(currentStep)}
          className="text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
          style={{ color: '#6b6b8a' }}
          title={lang === 'zh' ? '前往此頁面' : 'Jump to section'}
        >
          ⤵ {lang === 'zh' ? '前往' : 'Go'}
        </button>

        {currentStep < TOUR_STEPS.length - 1 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: '#ff6b35',
              color: '#0d0d14',
              fontWeight: 600,
            }}
          >
            {lang === 'zh' ? '下一步 →' : 'Next →'}
          </button>
        ) : (
          <button
            onClick={handleClose}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ background: '#22d3ee', color: '#0d0d14', fontWeight: 600 }}
          >
            {lang === 'zh' ? '完成 ✓' : 'Done ✓'}
          </button>
        )}
      </div>
    </div>
  )
}
