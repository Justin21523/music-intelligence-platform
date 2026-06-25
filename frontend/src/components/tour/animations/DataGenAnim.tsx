import { useEffect, useState } from 'react'

const TARGETS = [
  { label: 'Tracks', target: 10000, color: '#ff6b35' },
  { label: 'Artists', target: 800, color: '#22d3ee' },
  { label: 'Users', target: 500, color: '#a78bfa' },
]

function useCounter(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      setValue(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return value
}

function Counter({ label, target, color }: { label: string; target: number; color: string }) {
  const value = useCounter(target)
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="text-lg font-bold tabular-nums"
        style={{ color, fontVariantNumeric: 'tabular-nums' }}
      >
        {value.toLocaleString()}
      </span>
      <span className="text-xs" style={{ color: '#6b6b8a' }}>{label}</span>
    </div>
  )
}

export function DataGenAnim() {
  return (
    <div className="flex items-center justify-around w-full h-full py-3">
      {TARGETS.map((t) => (
        <Counter key={t.label} {...t} />
      ))}
    </div>
  )
}
