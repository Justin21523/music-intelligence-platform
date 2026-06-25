// 24-bar chart: listening activity by hour of day
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const HEIGHTS = [
  8, 5, 3, 2, 2, 4, 14, 28, 52, 68, 58, 60,
  72, 70, 55, 45, 48, 52, 65, 75, 70, 55, 35, 18,
]
const MAX_H = 75
const BAR_W = 8
const BAR_GAP = 1
const SVG_H = 80

export function PatternsAnim() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
      <style>{`
        .pat-bar {
          animation: pat-grow 0.35s cubic-bezier(0.4,0,0.2,1) both;
          transform-origin: bottom;
          scaleY: 0;
        }
        @keyframes pat-grow {
          from { transform: scaleY(0); opacity: 0; }
          to   { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
      <p className="text-xs font-semibold" style={{ color: '#6b6b8a' }}>Listening by hour of day</p>
      <svg
        width={(BAR_W + BAR_GAP) * 24}
        height={SVG_H + 14}
        viewBox={`0 0 ${(BAR_W + BAR_GAP) * 24} ${SVG_H + 14}`}
        style={{ overflow: 'visible' }}
      >
        {HOURS.map((h) => {
          const barH = (HEIGHTS[h] / MAX_H) * SVG_H
          const x = h * (BAR_W + BAR_GAP)
          const y = SVG_H - barH
          const isPeak = HEIGHTS[h] > 50
          return (
            <g key={h}>
              <rect
                className="pat-bar"
                x={x} y={y} width={BAR_W} height={barH}
                rx={2}
                fill={isPeak ? '#ff6b35' : 'rgba(255,107,53,0.4)'}
                style={{ animationDelay: `${h * 0.04}s`, transformOrigin: `${x + BAR_W / 2}px ${SVG_H}px` }}
              />
              {h % 6 === 0 && (
                <text x={x + BAR_W / 2} y={SVG_H + 12} textAnchor="middle" fontSize="7" fill="#6b6b8a">
                  {h}h
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
