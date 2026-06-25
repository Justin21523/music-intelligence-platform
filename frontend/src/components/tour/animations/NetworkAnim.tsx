const NODES = [
  { cx: 50,  cy: 40,  r: 20, color: '#ff6b35', dx: 1.2, dy: 0.8 },
  { cx: 160, cy: 30,  r: 14, color: '#22d3ee', dx: -0.9, dy: 1.1 },
  { cx: 240, cy: 80,  r: 18, color: '#a78bfa', dx: 0.7, dy: -1.0 },
  { cx: 120, cy: 100, r: 12, color: '#34d399', dx: -1.1, dy: -0.7 },
  { cx: 60,  cy: 130, r: 16, color: '#f59e0b', dx: 1.0, dy: 0.9 },
  { cx: 200, cy: 140, r: 22, color: '#ff6b35', dx: -0.8, dy: -1.2 },
  { cx: 290, cy: 50,  r: 13, color: '#22d3ee', dx: 1.3, dy: 0.6 },
  { cx: 310, cy: 130, r: 17, color: '#a78bfa', dx: -1.0, dy: 0.8 },
]

const EDGES = [
  [0, 1], [0, 3], [1, 2], [1, 3], [2, 6], [2, 7],
  [3, 4], [3, 5], [4, 5], [5, 7], [6, 7],
]

export function NetworkAnim() {
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <style>{`
        ${NODES.map((n, i) => `
          .net-node-${i} {
            animation: net-float-${i} ${2.4 + (i * 0.3) % 1.2}s ease-in-out infinite alternate;
          }
          @keyframes net-float-${i} {
            from { transform: translate(0, 0); }
            to   { transform: translate(${n.dx * 10}px, ${n.dy * 10}px); }
          }
        `).join('')}
        .net-pulse { animation: net-pulse 2.5s ease-in-out infinite; }
        @keyframes net-pulse {
          0%, 100% { opacity: 0.25; }
          50%       { opacity: 0.55; }
        }
      `}</style>
      <svg width="340" height="170" viewBox="0 0 340 170">
        {EDGES.map(([a, b], i) => (
          <line
            key={i}
            className="net-pulse"
            x1={NODES[a].cx} y1={NODES[a].cy}
            x2={NODES[b].cx} y2={NODES[b].cy}
            stroke="#25253a" strokeWidth="1.5"
          />
        ))}
        {NODES.map((n, i) => (
          <g key={i} className={`net-node-${i}`}>
            <circle cx={n.cx} cy={n.cy} r={n.r + 4} fill={n.color} opacity={0.12} />
            <circle cx={n.cx} cy={n.cy} r={n.r} fill={n.color} opacity={0.85} />
          </g>
        ))}
      </svg>
    </div>
  )
}
