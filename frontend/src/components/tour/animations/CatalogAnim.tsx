// SVG pie with stroke-dashoffset animation per genre slice
const GENRES = [
  { label: 'Hip-Hop',     pct: 22, color: '#ff6b35' },
  { label: 'Classical',   pct: 18, color: '#22d3ee' },
  { label: 'Electronic',  pct: 16, color: '#a78bfa' },
  { label: 'Latin',       pct: 12, color: '#f7c59f' },
  { label: 'Ambient',     pct: 10, color: '#34d399' },
  { label: 'Others',      pct: 22, color: '#6b6b8a' },
]

const R = 32
const CIRC = 2 * Math.PI * R // ~201

export function CatalogAnim() {
  let cumPct = 0
  const slices = GENRES.map((g) => {
    const dash = (g.pct / 100) * CIRC
    const gap = CIRC - dash
    const offset = -((cumPct / 100) * CIRC)
    cumPct += g.pct
    return { ...g, dash, gap, offset }
  })

  return (
    <div className="w-full h-full flex items-center justify-center gap-6">
      <style>{`
        .cat-slice {
          transform-origin: center;
          animation: cat-appear 0.5s ease forwards;
          opacity: 0;
        }
        @keyframes cat-appear {
          from { opacity: 0; stroke-dasharray: 0 201; }
          to   { opacity: 1; stroke-dasharray: var(--dash) var(--gap); }
        }
      `}</style>

      {/* Pie */}
      <svg width="88" height="88" viewBox="0 0 88 88">
        {slices.map((s, i) => (
          <circle
            key={s.label}
            className="cat-slice"
            cx="44"
            cy="44"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="12"
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={s.offset}
            style={{
              '--dash': s.dash,
              '--gap': s.gap,
              animationDelay: `${i * 0.12}s`,
            } as React.CSSProperties}
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-0.5">
        {GENRES.map((g) => (
          <div key={g.label} className="flex items-center gap-1.5 text-xs" style={{ color: '#e8e8f0' }}>
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: g.color }} />
            <span style={{ color: '#6b6b8a', fontSize: '10px' }}>{g.label}</span>
            <span className="ml-auto tabular-nums" style={{ fontSize: '10px', color: g.color }}>{g.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
