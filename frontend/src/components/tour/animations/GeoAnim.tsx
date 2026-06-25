const GEO_BARS = [
  { label: 'USA',    pct: 100, color: '#ff6b35', delay: '0s'    },
  { label: 'UK',     pct: 80,  color: '#f59e0b', delay: '0.08s' },
  { label: 'JPN',    pct: 62,  color: '#22d3ee', delay: '0.16s' },
  { label: 'BRA',    pct: 50,  color: '#a78bfa', delay: '0.24s' },
  { label: 'KOR',    pct: 40,  color: '#34d399', delay: '0.32s' },
  { label: 'DEU',    pct: 32,  color: '#f87171', delay: '0.40s' },
  { label: 'AUS',    pct: 24,  color: '#60a5fa', delay: '0.48s' },
]

export function GeoAnim() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px 16px', gap: 6 }}>
      <style>{`
        @keyframes growBar {
          from { width: 0%; opacity: 0; }
          to   { width: var(--bar-w); opacity: 1; }
        }
        @keyframes fadeLabel {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      {GEO_BARS.map(({ label, pct, color, delay }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 9,
              color: '#9b9bb8',
              width: 30,
              textAlign: 'right',
              flexShrink: 0,
              animation: `fadeLabel 0.4s ${delay} ease-out both`,
            }}
          >
            {label}
          </span>
          <div style={{ flex: 1, background: '#25253a', borderRadius: 3, height: 12, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                borderRadius: 3,
                background: color,
                // @ts-expect-error CSS custom property
                '--bar-w': `${pct}%`,
                animation: `growBar 0.6s ${delay} cubic-bezier(0.4,0,0.2,1) both`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
