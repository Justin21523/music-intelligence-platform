const PILLS = [
  { label: 'Hip-Hop',   selected: true },
  { label: 'Jazz',      selected: false },
  { label: 'Classical', selected: true },
  { label: 'Pop',       selected: false },
  { label: 'Rock',      selected: false },
]

export function FacetAnim() {
  return (
    <div className="w-full h-full flex flex-col justify-center gap-3 px-3">
      <style>{`
        .facet-pill {
          animation: facet-in 0.4s ease forwards;
          opacity: 0;
          animation-fill-mode: both;
        }
        @keyframes facet-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .facet-selected {
          animation: facet-in 0.4s ease both, facet-glow 2s ease-in-out 0.8s infinite;
        }
        @keyframes facet-glow {
          0%, 100% { box-shadow: 0 0 0px rgba(255,107,53,0.4); }
          50%       { box-shadow: 0 0 10px rgba(255,107,53,0.6); }
        }
        .facet-check {
          animation: facet-check-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes facet-check-pop {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <p className="text-xs font-semibold" style={{ color: '#6b6b8a' }}>Filter by genre</p>
      <div className="flex flex-wrap gap-2">
        {PILLS.map((p, i) => (
          <span
            key={p.label}
            className={p.selected ? 'facet-selected' : 'facet-pill'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              animationDelay: `${i * 0.18}s`,
              background: p.selected ? '#ff6b35' : 'rgba(255,255,255,0.05)',
              color: p.selected ? '#0d0d14' : '#9b9bb8',
              border: `1px solid ${p.selected ? '#ff6b35' : '#25253a'}`,
            }}
          >
            {p.selected && (
              <span
                className="facet-check"
                style={{ animationDelay: `${i * 0.18 + 0.35}s`, display: 'inline-block' }}
              >
                ✓
              </span>
            )}
            {p.label}
          </span>
        ))}
      </div>
      <p className="text-xs" style={{ color: '#6b6b8a' }}>2 filters active · 3,200 tracks</p>
    </div>
  )
}
