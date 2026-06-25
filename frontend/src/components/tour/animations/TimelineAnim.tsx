// Area chart: catalog coverage 1960-2024, animated fill
const YEARS = [1960, 1970, 1980, 1990, 2000, 2010, 2020, 2024]
const VALUES = [5, 12, 28, 48, 72, 85, 92, 95] // percent

const W = 280
const H = 90
const PAD_L = 28
const PAD_B = 18

function toSvgPt(i: number, v: number): [number, number] {
  const x = PAD_L + (i / (VALUES.length - 1)) * (W - PAD_L - 8)
  const y = H - PAD_B - (v / 100) * (H - PAD_B - 8)
  return [x, y]
}

const POINTS = VALUES.map((v, i) => toSvgPt(i, v))
const AREA_D = [
  `M ${POINTS[0][0]},${H - PAD_B}`,
  ...POINTS.map(([x, y]) => `L ${x},${y}`),
  `L ${POINTS[POINTS.length - 1][0]},${H - PAD_B}`,
  'Z',
].join(' ')
const LINE_D = ['M', ...POINTS.map(([x, y]) => `${x},${y}`)].join(' L ')

export function TimelineAnim() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <style>{`
        .tl-clip-rect { animation: tl-reveal 1.8s cubic-bezier(0.4,0,0.2,1) both; }
        @keyframes tl-reveal {
          from { width: 0; }
          to   { width: ${W}px; }
        }
        .tl-line { animation: tl-reveal 1.8s cubic-bezier(0.4,0,0.2,1) both; stroke-dasharray: 600; stroke-dashoffset: 600; }
        @keyframes tl-line {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
      <svg width={W} height={H + 12} viewBox={`0 0 ${W} ${H + 12}`}>
        <defs>
          <clipPath id="tl-clip">
            <rect className="tl-clip-rect" x={PAD_L} y={0} width={W} height={H + 12} />
          </clipPath>
        </defs>
        {/* Axes */}
        <line x1={PAD_L} y1={8} x2={PAD_L} y2={H - PAD_B} stroke="#25253a" strokeWidth="1" />
        <line x1={PAD_L} y1={H - PAD_B} x2={W - 4} y2={H - PAD_B} stroke="#25253a" strokeWidth="1" />
        {/* Year labels */}
        {YEARS.map((yr, i) => {
          const [x] = toSvgPt(i, 0)
          return i % 2 === 0 ? (
            <text key={yr} x={x} y={H} fontSize="7" fill="#6b6b8a" textAnchor="middle">{yr}</text>
          ) : null
        })}
        {/* Area fill */}
        <path d={AREA_D} fill="#ff6b35" opacity="0.22" clipPath="url(#tl-clip)" />
        {/* Line */}
        <path d={LINE_D} fill="none" stroke="#ff6b35" strokeWidth="2" strokeLinecap="round"
          clipPath="url(#tl-clip)" />
        {/* Dots */}
        {POINTS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#ff6b35" clipPath="url(#tl-clip)" />
        ))}
      </svg>
      <p className="text-xs mt-1" style={{ color: '#6b6b8a' }}>Catalog coverage by decade (%)</p>
    </div>
  )
}
