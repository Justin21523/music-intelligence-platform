// Age group × genre preference heatmap
const AGE_GROUPS = ['18-24', '25-34', '35-44', '45-54', '55+']
const GENRES = ['Hip-Hop', 'Pop', 'Rock', 'Jazz', 'Classical', 'Electro']

// intensity 0-1 per cell
const DATA = [
  [0.92, 0.75, 0.45, 0.20, 0.10, 0.80],
  [0.65, 0.82, 0.60, 0.35, 0.25, 0.55],
  [0.40, 0.60, 0.78, 0.55, 0.42, 0.30],
  [0.20, 0.45, 0.70, 0.75, 0.68, 0.18],
  [0.10, 0.30, 0.55, 0.80, 0.90, 0.12],
]

function intensityColor(v: number) {
  // orange scale
  const alpha = 0.12 + v * 0.85
  return `rgba(255, 107, 53, ${alpha.toFixed(2)})`
}

const CELL_W = 38
const CELL_H = 18

export function CohortAnim() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
      <style>{`
        .cohort-cell {
          animation: cohort-in 0.35s ease both;
        }
        @keyframes cohort-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
      <p className="text-xs font-semibold" style={{ color: '#6b6b8a' }}>Age group × genre preference</p>
      <div style={{ display: 'grid', gridTemplateColumns: `38px repeat(6, ${CELL_W}px)`, gap: 2 }}>
        <span />
        {GENRES.map(g => (
          <span key={g} style={{ fontSize: 7, color: '#6b6b8a', textAlign: 'center', lineHeight: 1.2 }}>
            {g.slice(0, 6)}
          </span>
        ))}
        {DATA.map((row, ri) => [
          <span key={`ag${ri}`} style={{ fontSize: 8, color: '#9b9bb8', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 3 }}>
            {AGE_GROUPS[ri]}
          </span>,
          ...row.map((v, ci) => (
            <div
              key={`${ri}-${ci}`}
              className="cohort-cell"
              style={{
                width: CELL_W,
                height: CELL_H,
                borderRadius: 3,
                backgroundColor: intensityColor(v),
                border: '1px solid #0d0d14',
                animationDelay: `${(ri * 6 + ci) * 0.045}s`,
              }}
            />
          )),
        ])}
      </div>
    </div>
  )
}
