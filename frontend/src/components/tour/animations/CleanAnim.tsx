const ROWS = [
  { title: 'Neon Dreams', genre: 'Electronic', ok: true },
  { title: 'NULL', genre: '—', ok: false },
  { title: 'Quiet Storm', genre: 'Jazz', ok: true },
  { title: 'T001 T001', genre: 'Pop', ok: false },
  { title: 'Solar Wind', genre: 'Ambient', ok: true },
]

export function CleanAnim() {
  return (
    <div className="w-full h-full flex flex-col justify-center gap-0.5 text-xs font-mono">
      <style>{`
        .clean-row-bad {
          animation: tour-strikeRow 0.5s ease forwards;
          animation-delay: 0.6s;
        }
        .clean-check {
          animation: tour-pop 0.4s ease forwards;
          animation-delay: 1.3s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        @keyframes tour-strikeRow {
          0%   { opacity: 1; }
          60%  { opacity: 0.3; text-decoration: line-through; color: #ef4444; }
          100% { opacity: 0.15; text-decoration: line-through; color: #ef4444; }
        }
        @keyframes tour-pop {
          0%   { transform: scale(0); opacity: 0; }
          70%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      {ROWS.map((row, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 px-2 py-0.5 rounded ${row.ok ? '' : 'clean-row-bad'}`}
          style={{ background: 'rgba(255,255,255,0.03)', color: row.ok ? '#e8e8f0' : '#6b6b8a' }}
        >
          <span className="w-3">{row.ok ? '✓' : '✗'}</span>
          <span className="flex-1 truncate">{row.title}</span>
          <span style={{ color: '#6b6b8a' }}>{row.genre}</span>
        </div>
      ))}
      <div className="flex items-center justify-center mt-1 gap-1 clean-check">
        <span className="text-xs font-bold" style={{ color: '#22d3ee' }}>✓ 3 rows cleaned</span>
      </div>
    </div>
  )
}
