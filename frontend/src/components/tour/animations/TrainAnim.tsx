const MODELS = [
  { name: 'Pop',     color: '#ff6b35', pct: 55 },
  { name: 'I-Sim',  color: '#f7c59f', pct: 78 },
  { name: 'ALS',    color: '#22d3ee', pct: 90 },
  { name: 'CBF',    color: '#a78bfa', pct: 72 },
  { name: 'Hybrid', color: '#34d399', pct: 95 },
]

const R = 16
const CIRC = 2 * Math.PI * R // ~100.5

export function TrainAnim() {
  return (
    <div className="w-full h-full flex items-center justify-around px-2">
      <style>{`
        .train-arc {
          animation: train-fill 0.8s ease forwards;
          stroke-dasharray: 0 101;
        }
        @keyframes train-fill {
          from { stroke-dasharray: 0 101; }
          to   { stroke-dasharray: var(--arc-len) 101; }
        }
      `}</style>
      {MODELS.map((m, i) => (
        <div key={m.name} className="flex flex-col items-center gap-1">
          <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
            {/* track */}
            <circle cx="22" cy="22" r={R} fill="none" stroke="#25253a" strokeWidth="4" />
            {/* progress */}
            <circle
              className="train-arc"
              cx="22"
              cy="22"
              r={R}
              fill="none"
              stroke={m.color}
              strokeWidth="4"
              strokeLinecap="round"
              style={{
                '--arc-len': (m.pct / 100) * CIRC,
                animationDelay: `${i * 0.18}s`,
              } as React.CSSProperties}
            />
          </svg>
          <span className="text-xs font-medium" style={{ color: m.color, fontSize: '10px' }}>
            {m.name}
          </span>
        </div>
      ))}
    </div>
  )
}
