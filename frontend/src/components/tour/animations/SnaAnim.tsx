const SPOKES = [
  { angle: 0,   color: '#22d3ee' },
  { angle: 60,  color: '#a78bfa' },
  { angle: 120, color: '#34d399' },
  { angle: 180, color: '#f59e0b' },
  { angle: 240, color: '#f472b6' },
  { angle: 300, color: '#22d3ee' },
]

const R = 68

function polar(angleDeg: number, r: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return { x: 85 + Math.cos(rad) * r, y: 85 + Math.sin(rad) * r }
}

export function SnaAnim() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <style>{`
        ${SPOKES.map((_, i) => `
          .sna-line-${i} {
            animation: sna-pulse-${i} 2s ease-in-out infinite;
            animation-delay: ${i * 0.33}s;
          }
          @keyframes sna-pulse-${i} {
            0%, 100% { opacity: 0.15; stroke-width: 1; }
            50%       { opacity: 0.9;  stroke-width: 2.5; }
          }
          .sna-node-${i} {
            animation: sna-pop-${i} 2s ease-in-out infinite;
            animation-delay: ${i * 0.33}s;
          }
          @keyframes sna-pop-${i} {
            0%, 100% { r: 7; opacity: 0.5; }
            50%       { r: 10; opacity: 1; }
          }
        `).join('')}
        .sna-center { animation: sna-center-pulse 2s ease-in-out infinite; }
        @keyframes sna-center-pulse {
          0%, 100% { r: 20; opacity: 0.8; }
          50%       { r: 24; opacity: 1; }
        }
      `}</style>
      <svg width="170" height="170" viewBox="0 0 170 170">
        {/* Glow ring */}
        <circle cx="85" cy="85" r="26" fill="#ff6b35" opacity="0.08" />
        {/* Spokes */}
        {SPOKES.map((s, i) => {
          const pt = polar(s.angle, R)
          return (
            <line
              key={i}
              className={`sna-line-${i}`}
              x1={85} y1={85} x2={pt.x} y2={pt.y}
              stroke={s.color} strokeWidth="1.5"
            />
          )
        })}
        {/* Outer nodes */}
        {SPOKES.map((s, i) => {
          const pt = polar(s.angle, R)
          return (
            <circle
              key={i}
              className={`sna-node-${i}`}
              cx={pt.x} cy={pt.y} r={8}
              fill={s.color} opacity={0.85}
            />
          )
        })}
        {/* Center */}
        <circle className="sna-center" cx="85" cy="85" r="20" fill="#ff6b35" />
        <text x="85" y="90" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0d0d14">HUB</text>
      </svg>
    </div>
  )
}
