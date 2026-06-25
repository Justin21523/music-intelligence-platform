export function RecommendAnim() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <style>{`
        .rec-arrow { animation: rec-dash 0.6s ease forwards; stroke-dashoffset: 80; }
        .rec-note  { animation: tour-pop 0.35s ease forwards; opacity: 0; animation-fill-mode: forwards; }
        .rec-user  { animation: tour-fadeIn 0.4s ease forwards; opacity: 0; animation-fill-mode: forwards; }
        @keyframes rec-dash  { from { stroke-dashoffset: 80; } to { stroke-dashoffset: 0; } }
        @keyframes tour-pop  { 0% { transform:scale(0);opacity:0; } 70% { transform:scale(1.2);opacity:1; } 100% { transform:scale(1);opacity:1; } }
        @keyframes tour-fadeIn { from { opacity:0;transform:translateY(4px); } to { opacity:1;transform:none; } }
      `}</style>

      <svg viewBox="0 0 240 90" width="240" height="90" overflow="visible">
        {/* User circle */}
        <g className="rec-user">
          <circle cx="28" cy="45" r="18" fill="rgba(255,107,53,0.15)" stroke="#ff6b35" strokeWidth="2" />
          <text x="28" y="50" textAnchor="middle" fontSize="16" fill="#ff6b35">👤</text>
        </g>

        {/* Arrows */}
        {[28, 45, 62].map((y, i) => (
          <path
            key={y}
            className="rec-arrow"
            d={`M 52 ${y} L 148 ${y}`}
            stroke="#ff6b35"
            strokeWidth="1.5"
            strokeDasharray="80"
            fill="none"
            markerEnd="url(#arr)"
            style={{ animationDelay: `${0.3 + i * 0.12}s` }}
          />
        ))}

        <defs>
          <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#ff6b35" />
          </marker>
        </defs>

        {/* Track cards */}
        {[20, 38, 56].map((y, i) => (
          <g
            key={y}
            className="rec-note"
            style={{ animationDelay: `${0.7 + i * 0.15}s` }}
          >
            <rect x="158" y={y} width="68" height="16" rx="4" fill="rgba(34,211,238,0.12)" stroke="#22d3ee" strokeWidth="1" />
            <text x="164" y={y + 11} fontSize="9" fill="#22d3ee">♪ Track {String(i + 1).padStart(2, '0')}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}
