interface Props {
  matrix: number[][]
  models: string[]
}

export function OverlapHeatmap({ matrix, models }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1 mx-auto">
        <thead>
          <tr>
            <th className="w-24" />
            {models.map((m) => (
              <th key={m} className="w-24 text-xs font-medium text-center pb-1" style={{ color: '#6b6b8a' }}>
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {models.map((row, i) => (
            <tr key={row}>
              <td className="text-xs font-medium text-right pr-2" style={{ color: '#6b6b8a' }}>
                {row}
              </td>
              {models.map((_, j) => {
                const v = matrix[i]?.[j] ?? 0
                const isDiag = i === j
                const alpha = isDiag ? 0.9 : v
                const bg = isDiag
                  ? 'rgba(34,211,238,0.3)'
                  : `rgba(255,107,53,${Math.max(0.05, alpha)})`
                return (
                  <td
                    key={j}
                    className="w-24 h-16 text-center rounded-lg text-sm font-bold transition-all"
                    style={{
                      background: bg,
                      color: isDiag ? '#22d3ee' : v > 0.4 ? '#fff' : '#e8e8f0',
                    }}
                  >
                    {Math.round(v * 100)}%
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
