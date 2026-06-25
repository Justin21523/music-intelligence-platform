const TOKENS = ['upbeat', 'electronic', 'chill']
const SCORES = [0.91, 0.84, 0.76]

export function SearchAnim() {
  return (
    <div className="w-full h-full flex flex-col justify-center gap-2 px-2">
      <style>{`
        .srch-token {
          animation: tour-fadeIn 0.35s ease forwards;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .srch-bar {
          animation: srch-grow 0.5s ease forwards;
          width: 0;
          animation-fill-mode: forwards;
        }
        @keyframes tour-fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes srch-grow {
          from { width: 0; }
          to   { width: var(--w); }
        }
      `}</style>

      {/* Token row */}
      <div className="flex gap-1.5 flex-wrap">
        {TOKENS.map((tok, i) => (
          <span
            key={tok}
            className="srch-token px-2 py-0.5 rounded text-xs font-mono font-medium"
            style={{
              background: 'rgba(255,107,53,0.15)',
              color: '#ff6b35',
              border: '1px solid rgba(255,107,53,0.3)',
              animationDelay: `${i * 0.15}s`,
            }}
          >
            {tok}
          </span>
        ))}
        <span
          className="srch-token text-xs"
          style={{ color: '#6b6b8a', animationDelay: '0.55s' }}
        >
          → BM25 scoring
        </span>
      </div>

      {/* Score bars */}
      <div className="space-y-1">
        {SCORES.map((score, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs w-16 text-right tabular-nums" style={{ color: '#6b6b8a', fontSize: '10px' }}>
              Track {String(i + 1).padStart(3, '0')}
            </span>
            <div className="flex-1 h-1.5 rounded" style={{ background: '#25253a' }}>
              <div
                className="srch-bar h-full rounded"
                style={{
                  background: '#22d3ee',
                  '--w': `${score * 100}%`,
                  animationDelay: `${0.7 + i * 0.15}s`,
                } as React.CSSProperties}
              />
            </div>
            <span className="text-xs tabular-nums" style={{ color: '#22d3ee', fontSize: '10px' }}>
              {score}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
