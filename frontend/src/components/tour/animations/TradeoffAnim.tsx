const MODELS = [
  { label: 'Pop',     x: 60,  y: 90,  r: 30, color: '#ff6b35' },
  { label: 'ALS',    x: 155, y: 55,  r: 40, color: '#22d3ee' },
  { label: 'Content',x: 240, y: 95,  r: 25, color: '#a78bfa' },
  { label: 'Hybrid', x: 155, y: 115, r: 35, color: '#34d399' },
]

export function TradeoffAnim() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
      <style>{`
        ${MODELS.map((m, i) => `
          .to-bubble-${i} {
            animation: to-grow-${i} 0.7s cubic-bezier(0.34,1.56,0.64,1) both;
            animation-delay: ${i * 0.18}s;
          }
          @keyframes to-grow-${i} {
            from { r: 0; opacity: 0; }
            to   { r: ${m.r}; opacity: 0.82; }
          }
          .to-label-${i} {
            animation: to-fadein 0.4s ease ${i * 0.18 + 0.5}s both;
          }
          @keyframes to-fadein { from { opacity: 0; } to { opacity: 1; } }
        `).join('')}
      `}</style>
      <p className="text-xs font-semibold" style={{ color: '#6b6b8a' }}>Novelty × Diversity bubble</p>
      <svg width="300" height="150" viewBox="0 0 300 150">
        {/* Axis guides */}
        <text x="4" y="148" fontSize="8" fill="#6b6b8a">Novelty →</text>
        <text x="148" y="10" fontSize="8" fill="#6b6b8a">← Diversity</text>
        {MODELS.map((m, i) => (
          <g key={m.label}>
            <circle
              className={`to-bubble-${i}`}
              cx={m.x} cy={m.y} r={0}
              fill={m.color}
            />
            <text
              className={`to-label-${i}`}
              x={m.x} y={m.y + 3}
              textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0d0d14"
            >
              {m.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
