// 4×4 heatmap — orange=ALS picks, cyan=Content picks, overlap=conflict
const GRID = [
  ['#ff6b35','#22d3ee','#13131f','#ff6b35'],
  ['#13131f','#ff6b35','#22d3ee','#13131f'],
  ['#22d3ee','#13131f','#ff6b35','#22d3ee'],
  ['#ff6b35','#22d3ee','#13131f','#ff6b35'],
]

const MODEL_LABELS = ['ALS', 'Content', '', 'ALS']
const TRACK_LABELS = ['Tr.1', 'Tr.2', 'Tr.3', 'Tr.4']

export function DisagreeAnim() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
      <style>{`
        .dis-cell {
          animation: dis-flash 0.4s ease forwards;
          background: #13131f;
          animation-fill-mode: both;
        }
        @keyframes dis-flash {
          0%   { background: #13131f; opacity: 0.3; }
          60%  { opacity: 1; }
          100% { opacity: 0.85; }
        }
      `}</style>
      <p className="text-xs font-semibold" style={{ color: '#6b6b8a' }}>Model agreement map</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(4, 36px)', gap: 3, alignItems: 'center' }}>
        {/* Header row */}
        <span />
        {MODEL_LABELS.map((l, i) => (
          <span key={i} style={{ fontSize: 9, color: '#6b6b8a', textAlign: 'center' }}>{l}</span>
        ))}
        {/* Data rows */}
        {GRID.map((row, ri) => [
          <span key={`label-${ri}`} style={{ fontSize: 9, color: '#6b6b8a', paddingRight: 4, textAlign: 'right' }}>
            {TRACK_LABELS[ri]}
          </span>,
          ...row.map((color, ci) => (
            <div
              key={`${ri}-${ci}`}
              className="dis-cell"
              style={{
                width: 36,
                height: 28,
                borderRadius: 4,
                backgroundColor: color,
                animationDelay: `${(ri * 4 + ci) * 0.07}s`,
                border: '1px solid #0d0d14',
              }}
            />
          )),
        ])}
      </div>
      <div className="flex gap-4 mt-1">
        <span style={{ fontSize: 9, color: '#ff6b35' }}>■ ALS</span>
        <span style={{ fontSize: 9, color: '#22d3ee' }}>■ Content</span>
        <span style={{ fontSize: 9, color: '#6b6b8a' }}>■ Neither</span>
      </div>
    </div>
  )
}
