import { useNavigate } from 'react-router-dom'
import { useTourStore } from '@/store/tourStore'
import { TOUR_STEPS } from '@/data/tourSteps'

export function TourLauncher() {
  const navigate = useNavigate()
  const { setActive, setStep, setPendingAnchor } = useTourStore()

  function startTour() {
    const first = TOUR_STEPS[0]
    setStep(0)
    setActive(true)
    setPendingAnchor(first.anchor)
    navigate(first.route)
  }

  return (
    <button
      onClick={startTour}
      className="flex items-center gap-2 w-full px-5 py-2.5 text-sm transition-all hover:opacity-90 active:scale-95"
      style={{
        color: '#ff6b35',
        background: 'rgba(255,107,53,0.08)',
        borderTop: '1px solid #25253a',
        fontWeight: 500,
      }}
    >
      <span className="text-base">▶</span>
      <span>Pipeline Journey</span>
      <span
        className="ml-auto text-xs px-1.5 py-0.5 rounded-full"
        style={{ background: 'rgba(255,107,53,0.2)', color: '#ff6b35', fontSize: '10px' }}
      >
        8 steps
      </span>
    </button>
  )
}
