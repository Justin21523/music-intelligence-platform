const STEPS = [
  { label: 'Validate',  icon: '✓' },
  { label: 'Features',  icon: '⚙' },
  { label: 'Train',     icon: '⚡' },
  { label: 'Index',     icon: '🔍' },
  { label: 'Evaluate',  icon: '📊' },
  { label: 'Done',      icon: '🚀' },
]

const STEP_DURATION = 0.8 // seconds each
const CYCLE = STEPS.length * STEP_DURATION + 1.5

export function PipelineAnim() {
  return (
    <div className="w-full h-full flex flex-col justify-center gap-1.5 px-4">
      <style>{`
        ${STEPS.map((_, i) => `
          .pipe-step-${i} {
            animation: pipe-light ${CYCLE}s ease-in-out infinite;
            animation-delay: ${i * STEP_DURATION}s;
          }
          .pipe-dot-${i} {
            animation: pipe-dot ${CYCLE}s ease-in-out infinite;
            animation-delay: ${i * STEP_DURATION}s;
          }
          @keyframes pipe-light {
            0%                                          { color: #6b6b8a; }
            ${((i * STEP_DURATION) / CYCLE * 100).toFixed(1)}% { color: #6b6b8a; }
            ${(((i + 0.1) * STEP_DURATION) / CYCLE * 100).toFixed(1)}% { color: #34d399; }
            ${((STEPS.length * STEP_DURATION + 0.3) / CYCLE * 100).toFixed(1)}% { color: #34d399; }
            100%                                        { color: #6b6b8a; }
          }
          @keyframes pipe-dot {
            0%                                          { background: #25253a; }
            ${((i * STEP_DURATION) / CYCLE * 100).toFixed(1)}% { background: #25253a; }
            ${(((i + 0.1) * STEP_DURATION) / CYCLE * 100).toFixed(1)}% { background: #34d399; box-shadow: 0 0 8px #34d399; }
            ${((STEPS.length * STEP_DURATION + 0.3) / CYCLE * 100).toFixed(1)}% { background: #34d399; }
            100%                                        { background: #25253a; }
          }
        `).join('')}
      `}</style>
      {STEPS.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2">
          <div
            className={`pipe-dot-${i}`}
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#25253a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 9,
            }}
          />
          <span
            className={`pipe-step-${i} text-xs font-medium`}
            style={{ color: '#6b6b8a' }}
          >
            {s.icon} {s.label}
          </span>
          {i < STEPS.length - 1 && (
            <div style={{ width: 1, height: 6, background: '#25253a', marginLeft: 8, marginTop: -2 }} />
          )}
        </div>
      ))}
    </div>
  )
}
