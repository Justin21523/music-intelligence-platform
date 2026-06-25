// Pentagon radar chart — listen profile (orange) vs rec profile (cyan)
const AXES = ['Energy', 'Dance', 'Valence', 'Acoustic', 'Loud']
const N = AXES.length
const CX = 85
const CY = 80
const R = 58

function polarPt(i: number, r: number) {
  const angle = (i / N) * 2 * Math.PI - Math.PI / 2
  return [CX + Math.cos(angle) * r, CY + Math.sin(angle) * r] as [number, number]
}

function toPoints(values: number[]) {
  return values.map((v, i) => polarPt(i, v * R)).map(([x, y]) => `${x},${y}`).join(' ')
}

const LISTEN_VALS = [0.82, 0.71, 0.65, 0.40, 0.78]
const REC_VALS    = [0.70, 0.85, 0.75, 0.55, 0.60]

export function DnaAnim() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <style>{`
        .dna-listen {
          animation: dna-draw 1.2s ease forwards;
          clip-path: inset(0 100% 0 0);
        }
        @keyframes dna-draw {
          from { opacity: 0; transform: scale(0); }
          to   { opacity: 0.65; transform: scale(1); }
        }
        .dna-rec {
          animation: dna-draw 1.2s ease 0.5s both;
        }
        .dna-axis { animation: dna-axis-in 0.6s ease both; }
        @keyframes dna-axis-in {
          from { opacity: 0; }
          to   { opacity: 0.35; }
        }
        .dna-label { animation: dna-axis-in 0.4s ease both; }
      `}</style>
      <svg width="170" height="160" viewBox="0 0 170 160">
        {/* Grid rings */}
        {[0.33, 0.66, 1.0].map((scale, ri) => (
          <polygon
            key={ri}
            className="dna-axis"
            style={{ animationDelay: `${ri * 0.1}s` }}
            points={toPoints(Array(N).fill(scale))}
            fill="none" stroke="#25253a" strokeWidth="1"
          />
        ))}
        {/* Axes */}
        {AXES.map((_, i) => {
          const [x, y] = polarPt(i, R)
          return (
            <line key={i} className="dna-axis" x1={CX} y1={CY} x2={x} y2={y}
              stroke="#25253a" strokeWidth="1" />
          )
        })}
        {/* Listen profile */}
        <polygon
          className="dna-listen"
          points={toPoints(LISTEN_VALS)}
          fill="#ff6b35" stroke="#ff6b35" strokeWidth="1.5"
        />
        {/* Rec profile */}
        <polygon
          className="dna-rec"
          points={toPoints(REC_VALS)}
          fill="#22d3ee" stroke="#22d3ee" strokeWidth="1.5"
          style={{ opacity: 0 }}
        />
        {/* Labels */}
        {AXES.map((label, i) => {
          const [x, y] = polarPt(i, R + 14)
          return (
            <text key={label} className="dna-label" x={x} y={y + 3}
              textAnchor="middle" fontSize="8" fill="#6b6b8a"
              style={{ animationDelay: `${i * 0.08}s` }}>
              {label}
            </text>
          )
        })}
        {/* Legend */}
        <rect x="4" y="142" width="8" height="8" rx="2" fill="#ff6b35" opacity="0.7" />
        <text x="15" y="150" fontSize="8" fill="#9b9bb8">Listen</text>
        <rect x="58" y="142" width="8" height="8" rx="2" fill="#22d3ee" opacity="0.7" />
        <text x="69" y="150" fontSize="8" fill="#9b9bb8">Recs</text>
      </svg>
    </div>
  )
}
