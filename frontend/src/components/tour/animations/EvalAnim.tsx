const BARS = [
  { label: 'Coverage', pct: 72, color: '#ff6b35' },
  { label: 'Novelty',  pct: 88, color: '#22d3ee' },
  { label: 'Diversity',pct: 55, color: '#a78bfa' },
  { label: 'nDCG',     pct: 40, color: '#34d399' },
]

export function EvalAnim() {
  const maxPct = Math.max(...BARS.map((b) => b.pct))
  const starIdx = BARS.findIndex((b) => b.pct === maxPct)

  return (
    <div className="w-full h-full flex items-end justify-center gap-4 px-4 pb-2">
      <style>{`
        .eval-bar {
          transform: scaleY(0);
          transform-origin: bottom;
          animation: eval-grow 0.6s ease forwards;
        }
        .eval-star {
          animation: tour-pop 0.4s ease forwards;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        @keyframes eval-grow {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
        @keyframes tour-pop {
          0%   { transform: scale(0); opacity: 0; }
          70%  { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {BARS.map((b, i) => {
        const heightPx = Math.round((b.pct / 100) * 70)
        return (
          <div key={b.label} className="flex flex-col items-center gap-1" style={{ position: 'relative' }}>
            {/* Star above highest bar */}
            {i === starIdx && (
              <span
                className="eval-star absolute text-sm"
                style={{ top: -(heightPx + 22), animationDelay: '0.9s' }}
              >
                ⭐
              </span>
            )}
            <div
              className="eval-bar rounded-t w-9"
              style={{
                height: heightPx,
                background: `linear-gradient(to top, ${b.color}, ${b.color}88)`,
                animationDelay: `${i * 0.12}s`,
              }}
            />
            <span className="text-xs text-center leading-tight" style={{ color: b.color, fontSize: '9px' }}>
              {b.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
