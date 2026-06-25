const FEATURES = [
  { name: 'Energy',  pct: 72, color: '#ff6b35' },
  { name: 'Dance',   pct: 65, color: '#22d3ee' },
  { name: 'Valence', pct: 58, color: '#a78bfa' },
  { name: 'Acoustic',pct: 30, color: '#34d399' },
  { name: 'Tempo',   pct: 61, color: '#f7c59f' },
  { name: 'Instr',   pct: 18, color: '#f59e0b' },
  { name: 'Loud',    pct: 80, color: '#ec4899' },
  { name: 'Speech',  pct: 12, color: '#6366f1' },
  { name: 'Live',    pct: 25, color: '#84cc16' },
]

export function FeatureAnim() {
  return (
    <div className="w-full h-full flex flex-col justify-center gap-0.5 px-1">
      <style>{`
        .feat-bar {
          height: 6px;
          border-radius: 3px;
          width: 0;
          animation: feat-fill 0.5s ease forwards;
        }
        @keyframes feat-fill {
          from { width: 0; }
          to   { width: var(--pct); }
        }
      `}</style>
      {FEATURES.map((f, i) => (
        <div key={f.name} className="flex items-center gap-1.5">
          <span
            className="text-xs w-12 shrink-0 text-right"
            style={{ color: '#6b6b8a', fontSize: '10px' }}
          >
            {f.name}
          </span>
          <div className="flex-1 h-1.5 rounded" style={{ background: '#25253a' }}>
            <div
              className="feat-bar"
              style={{
                background: f.color,
                '--pct': `${f.pct}%`,
                animationDelay: `${i * 0.07}s`,
              } as React.CSSProperties}
            />
          </div>
          <span className="text-xs w-6 tabular-nums" style={{ color: '#6b6b8a', fontSize: '10px' }}>
            {f.pct}
          </span>
        </div>
      ))}
    </div>
  )
}
