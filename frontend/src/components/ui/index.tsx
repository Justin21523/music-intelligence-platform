import { useState } from 'react'
import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes } from 'react'
import { seqColor } from '@/utils/colorScale'
import { cn } from '@/lib/utils'
import { useTourStore } from '@/store/tourStore'

/* ─── Card ─────────────────────────────────── */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn('rounded-lg border p-4', className)}
      style={{ background: '#14141f', borderColor: '#25253a' }}
    >
      {children}
    </div>
  )
}

/* ─── Badge ─────────────────────────────────── */
export function Badge({ children, color = '#ff6b35' }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: `${color}22`, color }}
    >
      {children}
    </span>
  )
}

/* ─── Button ─────────────────────────────────── */
type BtnVariant = 'primary' | 'ghost' | 'outline'
export function Button({
  children, onClick, variant = 'primary', disabled, className, type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: BtnVariant
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
  const styles: Record<BtnVariant, string> = {
    primary: 'text-white',
    ghost: 'hover:opacity-80',
    outline: 'border',
  }
  const inlineStyle: Record<BtnVariant, object> = {
    primary: { background: '#ff6b35', color: '#0d0d14' },
    ghost: { color: '#6b6b8a' },
    outline: { borderColor: '#25253a', color: '#e8e8f0', background: 'transparent' },
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(base, styles[variant], className)}
      style={inlineStyle[variant]}
    >
      {children}
    </button>
  )
}

/* ─── Input ─────────────────────────────────── */
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 transition-shadow',
        className
      )}
      style={{
        background: '#1a1a2e',
        borderColor: '#25253a',
        color: '#e8e8f0',
        // @ts-expect-error CSS custom property
        '--tw-ring-color': '#ff6b35',
      }}
    />
  )
}

/* ─── Select ─────────────────────────────────── */
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn('rounded-md border px-3 py-2 text-sm outline-none cursor-pointer', className)}
      style={{ background: '#1a1a2e', borderColor: '#25253a', color: '#e8e8f0' }}
    />
  )
}

/* ─── Spinner ─────────────────────────────────── */
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ff6b35"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

/* ─── PageTitle ─────────────────────────────────── */
export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold" style={{ color: '#e8e8f0' }}>{title}</h1>
      {subtitle && <p className="mt-1 text-sm" style={{ color: '#6b6b8a' }}>{subtitle}</p>}
    </div>
  )
}

/* ─── EmptyState ─────────────────────────────────── */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" style={{ color: '#6b6b8a' }}>
      <div className="text-4xl mb-3">🎵</div>
      <p className="text-sm">{message}</p>
    </div>
  )
}

/* ─── InsightPanel ─────────────────────────────────── */
export function InsightPanel({
  children,
  collapsible = false,
  title,
  journeyStep,
}: {
  children: ReactNode
  collapsible?: boolean
  title?: string
  journeyStep?: number
}) {
  const tourStore = useTourStore()

  function openJourney() {
    tourStore.setActive(true)
    tourStore.setStep(journeyStep!)
    tourStore.setMinimized(false)
  }

  const journeyLink = journeyStep !== undefined ? (
    <button
      onClick={openJourney}
      className="mt-2 flex items-center gap-1 text-xs transition-opacity hover:opacity-80"
      style={{ color: '#ff6b35' }}
    >
      → See this in Pipeline Journey
    </button>
  ) : null

  if (collapsible) {
    return <CollapsibleInsight title={title} journeyLink={journeyLink}>{children}</CollapsibleInsight>
  }
  return (
    <div
      className="mt-3 rounded-r-lg p-3 text-xs leading-relaxed"
      style={{
        background: 'rgba(255,107,53,0.06)',
        borderLeft: '3px solid #ff6b35',
        color: '#6b6b8a',
      }}
    >
      {children}
      {journeyLink}
    </div>
  )
}

function CollapsibleInsight({ children, title, journeyLink }: { children: ReactNode; title?: string; journeyLink?: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
        style={{ color: '#6b6b8a' }}
      >
        <span style={{ color: '#ff6b35', fontStyle: 'normal' }}>ℹ</span>
        {title ?? 'What this means'}
        <span style={{ fontSize: 9, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div
          className="mt-2 rounded-lg p-3 text-xs leading-relaxed"
          style={{ background: '#0d0d14', border: '1px solid #25253a', color: '#6b6b8a' }}
        >
          {children}
          {journeyLink}
        </div>
      )}
    </div>
  )
}

/* ─── ScoreBar ─────────────────────────────────── */
export function ScoreBar({ score, max = 1 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: '#25253a' }}>
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%`, background: '#ff6b35' }}
        />
      </div>
      <span className="text-xs tabular-nums w-8 text-right" style={{ color: '#6b6b8a' }}>
        {score.toFixed(2)}
      </span>
    </div>
  )
}

/* ─── Skeleton ──────────────────────────────────── */
export function Skeleton({
  width = '100%',
  height = 14,
  className,
}: {
  width?: string | number
  height?: string | number
  className?: string
}) {
  return (
    <>
      <style>{`
        @keyframes mip-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>
      <div
        className={className}
        style={{
          width,
          height,
          borderRadius: 6,
          backgroundImage: 'linear-gradient(90deg, #25253a 25%, #2e2e45 50%, #25253a 75%)',
          backgroundSize: '800px 100%',
          animation: 'mip-shimmer 1.5s ease-in-out infinite',
        }}
      />
    </>
  )
}

/* ─── AudioFeatureBars ──────────────────────────── */
export function AudioFeatureBars({
  energy,
  danceability,
  valence,
}: {
  energy?: number
  danceability?: number
  valence?: number
}) {
  if (energy == null && danceability == null && valence == null) return null
  const bars = [
    { label: 'E', value: energy,       title: 'Energy' },
    { label: 'D', value: danceability, title: 'Dance' },
    { label: 'V', value: valence,      title: 'Valence' },
  ] as const

  return (
    <div className="flex items-end gap-1 mt-1.5" title="Audio features: Energy / Danceability / Valence">
      {bars.map(({ label, value, title: ttl }) => {
        const v = value ?? 0
        return (
          <div key={label} className="flex flex-col items-center gap-0.5" title={`${ttl}: ${v.toFixed(2)}`}>
            <div
              style={{
                width: 20,
                height: 4,
                borderRadius: 2,
                background: seqColor(v),
                transition: 'width 0.3s',
              }}
            />
            <span style={{ fontSize: 8, color: '#6b6b8a', lineHeight: 1 }}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}
