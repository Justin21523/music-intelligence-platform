// 5×5 correlation matrix, fills row by row
const LABELS = ['Energy', 'Dance', 'Loud', 'Valence', 'Acoustic']
const MATRIX = [
  [1.00,  0.55,  0.78, -0.12, -0.70],
  [0.55,  1.00,  0.42,  0.30, -0.35],
  [0.78,  0.42,  1.00, -0.08, -0.65],
  [-0.12, 0.30, -0.08,  1.00,  0.15],
  [-0.70,-0.35, -0.65,  0.15,  1.00],
]

function corrColor(v: number) {
  if (v >= 0.9) return '#ff6b35'
  if (v >= 0.5) return '#f7a16e'
  if (v >= 0.1) return '#34d399'
  if (v >= -0.1) return '#25253a'
  if (v >= -0.5) return '#22d3ee'
  return '#a78bfa'
}

const CELL = 26

export function CorrAnim() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
      <style>{`
        .corr-cell {
          animation: corr-appear 0.3s ease both;
        }
        @keyframes corr-appear {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <p className="text-xs font-semibold mb-1" style={{ color: '#6b6b8a' }}>Pearson correlation matrix</p>
      <div style={{ display: 'grid', gridTemplateColumns: `40px repeat(5, ${CELL}px)`, gap: 2, alignItems: 'center' }}>
        <span />
        {LABELS.map(l => (
          <span key={l} style={{ fontSize: 7, color: '#6b6b8a', textAlign: 'center', lineHeight: 1.1 }}>
            {l.slice(0, 5)}
          </span>
        ))}
        {MATRIX.map((row, ri) => [
          <span key={`r${ri}`} style={{ fontSize: 7, color: '#6b6b8a', textAlign: 'right', paddingRight: 3 }}>
            {LABELS[ri].slice(0, 5)}
          </span>,
          ...row.map((v, ci) => (
            <div
              key={`${ri}-${ci}`}
              className="corr-cell"
              style={{
                width: CELL,
                height: CELL,
                borderRadius: 3,
                backgroundColor: corrColor(v),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animationDelay: `${(ri * 5 + ci) * 0.055}s`,
              }}
            >
              <span style={{ fontSize: 7, color: '#0d0d14', fontWeight: 700 }}>
                {v.toFixed(1)}
              </span>
            </div>
          )),
        ])}
      </div>
    </div>
  )
}
