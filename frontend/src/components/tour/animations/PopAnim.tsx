const BARS = [
  { label: 'Popularity', pct: 95, color: '#ff6b35' },
  { label: 'ALS',        pct: 78, color: '#f7a16e' },
  { label: 'Content',    pct: 61, color: '#22d3ee' },
  { label: 'Hybrid',     pct: 43, color: '#a78bfa' },
  { label: 'Item-Sim',   pct: 22, color: '#6b6b8a' },
]

export function PopAnim() {
  return (
    <div className="w-full h-full flex flex-col justify-center gap-2 px-3">
      <style>{`
        .pop-bar {
          animation: pop-grow 0.6s cubic-bezier(0.25,0.46,0.45,0.94) both;
          width: 0;
        }
        @keyframes pop-grow {
          from { width: 0; }
          to   { width: var(--w); }
        }
      `}</style>
      <p className="text-xs font-semibold mb-1" style={{ color: '#6b6b8a' }}>Mainstream hit rate (%)</p>
      {BARS.map((b, i) => (
        <div key={b.label} className="flex items-center gap-2">
          <span style={{ width: 58, fontSize: 10, color: '#9b9bb8', textAlign: 'right', flexShrink: 0 }}>
            {b.label}
          </span>
          <div className="flex-1 rounded" style={{ height: 10, background: '#25253a' }}>
            <div
              className="pop-bar h-full rounded"
              style={{
                '--w': `${b.pct}%`,
                background: b.color,
                animationDelay: `${i * 0.12}s`,
              } as React.CSSProperties}
            />
          </div>
          <span style={{ width: 26, fontSize: 10, color: b.color, tabularNums: true } as React.CSSProperties}>
            {b.pct}%
          </span>
        </div>
      ))}
    </div>
  )
}
