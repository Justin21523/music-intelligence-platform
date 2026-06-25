import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Upload, Play, CheckCircle, Circle, Loader, AlertCircle, Database,
  ArrowRight, Music, Users, Headphones, BarChart3, Network, Globe,
  Search, Zap, TrendingUp, Clock,
} from 'lucide-react'
import { Card, PageTitle, Button } from '@/components/ui/index'
import { useT } from '@/hooks/useT'
import { usePipelineStatus } from '@/hooks/usePipelineStatus'
import { useStats } from '@/hooks/useStats'
import { useEvaluation } from '@/hooks/useEvaluation'
import { startPipeline, resetPipeline, uploadPipelineFiles } from '@/api/endpoints'
import { useTourStore } from '@/store/tourStore'
import { seqColor } from '@/utils/colorScale'

const PIPELINE_TO_JOURNEY: Record<number, number> = {
  0: 0, 1: 2, 2: 4, 3: 5, 4: 7, 5: 7,
}

const STEP_LABEL_KEYS = [
  'upload.step.0', 'upload.step.1', 'upload.step.2',
  'upload.step.3', 'upload.step.4', 'upload.step.5',
] as const

const STEP_ICONS = ['📂', '🎵', '🤖', '🔍', '📊', '🔄']

const FILE_KEYS = ['artists_file', 'tracks_file', 'users_file', 'listens_file'] as const
const FILE_NAMES = ['artists.csv', 'tracks.csv', 'users.csv', 'listens.csv']
const FILE_DESCS = ['800 artists · country / popularity', '10,000 tracks · 9 audio features', '500 users · age group / country', '50,000 listen events · timestamps']

type FileMap = Partial<Record<typeof FILE_KEYS[number], File>>

const MODEL_COLORS: Record<string, string> = {
  popularity: '#ff6b35', item_similarity: '#f59e0b',
  als: '#22d3ee', content: '#a78bfa', hybrid: '#34d399',
}
const MODEL_LABELS: Record<string, string> = {
  popularity: 'Popularity', item_similarity: 'Item Sim',
  als: 'ALS', content: 'Content', hybrid: 'Hybrid',
}

// ── StepRow ────────────────────────────────────────────────────────────────

function StepRow({ idx, currentStep, totalSteps, label, stepTimes, icon }: {
  idx: number; currentStep: number; totalSteps: number
  label: string; stepTimes: number[]; icon: string
}) {
  const done   = idx < currentStep || currentStep >= totalSteps
  const active = idx === currentStep
  const pending = idx > currentStep
  return (
    <div
      className="flex items-center gap-3 py-3"
      style={{ borderBottom: idx < STEP_LABEL_KEYS.length - 1 ? '1px solid #1a1a2e' : 'none' }}
    >
      <span className="text-base shrink-0 w-6 text-center">{icon}</span>
      <div className="shrink-0">
        {done   ? <CheckCircle size={16} style={{ color: '#34d399' }} />
        : active ? <Loader size={16} style={{ color: '#ff6b35' }} className="animate-spin" />
        :           <Circle   size={16} style={{ color: '#25253a' }} />}
      </div>
      <span className="flex-1 text-sm"
        style={{ color: done ? '#34d399' : active ? '#ff6b35' : pending ? '#6b6b8a' : '#e8e8f0', fontWeight: active ? 600 : 400 }}>
        {idx + 1}. {label}
      </span>
      {done && stepTimes[idx] != null && (
        <span className="text-xs tabular-nums" style={{ color: '#34d399' }}>{stepTimes[idx].toFixed(1)}s</span>
      )}
      {active && <span className="text-xs animate-pulse" style={{ color: '#ff6b35' }}>running…</span>}
      {pending && <span className="text-xs" style={{ color: '#3a3a5c' }}>pending</span>}
    </div>
  )
}

// ── DestCard — navigation tiles shown after pipeline finishes ──────────────

function DestCard({ icon, title, desc, color, onClick }: {
  icon: React.ReactNode; title: string; desc: string; color: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-xl p-4 text-left w-full transition-all duration-200"
      style={{ background: '#14141f', border: '1px solid #25253a' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.background = `rgba(${hexToRgb(color)},0.06)` }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#25253a'; (e.currentTarget as HTMLElement).style.background = '#14141f' }}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg shrink-0" style={{ background: `rgba(${hexToRgb(color)},0.15)`, color }}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold mb-0.5" style={{ color: '#e8e8f0' }}>{title}</p>
          <p className="text-xs leading-relaxed" style={{ color: '#6b6b8a' }}>{desc}</p>
        </div>
        <ArrowRight size={14} className="ml-auto shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }} />
      </div>
    </button>
  )
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `${r},${g},${b}`
}

// ── Main page ──────────────────────────────────────────────────────────────

export function UploadPage() {
  const t = useT()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: status, refetch } = usePipelineStatus()
  const { data: stats }      = useStats()
  const { data: evaluation } = useEvaluation()

  const tourIsActive     = useTourStore((s) => s.isActive)
  const tourSetActive    = useTourStore((s) => s.setActive)
  const tourSetStep      = useTourStore((s) => s.setStep)
  const tourSetMinimized = useTourStore((s) => s.setMinimized)

  const [files, setFiles]               = useState<FileMap>({})
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [uploading, setUploading]       = useState(false)
  const [useSample, setUseSample]       = useState(true)
  const [stepTimes, setStepTimes]       = useState<number[]>([])
  const prevStepRef   = useRef(-1)
  const stepStartRef  = useRef<number>(0)
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null])

  const isRunning = status?.status === 'running'
  const isDone    = status?.status === 'done'
  const isError   = status?.status === 'error'
  const isIdle    = !status || status.status === 'idle'

  useEffect(() => {
    if (!status || status.status !== 'running') return
    const stepIdx = status.step_idx
    if (stepIdx === prevStepRef.current || stepIdx < 0) return
    if (prevStepRef.current >= 0) {
      const elapsed = (Date.now() - stepStartRef.current) / 1000
      setStepTimes((prev) => { const n = [...prev]; n[prevStepRef.current] = elapsed; return n })
    }
    prevStepRef.current = stepIdx
    stepStartRef.current = Date.now()
    const journeyIdx = PIPELINE_TO_JOURNEY[stepIdx]
    if (journeyIdx !== undefined) { tourSetStep(journeyIdx); tourSetMinimized(false) }
  }, [status?.step_idx, status?.status, tourSetStep, tourSetMinimized])

  useEffect(() => {
    if (status?.status === 'running' && !tourIsActive) {
      tourSetActive(true); tourSetStep(0); tourSetMinimized(false)
    }
  }, [status?.status, tourIsActive, tourSetActive, tourSetStep, tourSetMinimized])

  useEffect(() => {
    if (status?.status === 'done') {
      if (prevStepRef.current >= 0) {
        const elapsed = (Date.now() - stepStartRef.current) / 1000
        setStepTimes((prev) => { const n = [...prev]; if (n[prevStepRef.current] == null) n[prevStepRef.current] = elapsed; return n })
        prevStepRef.current = -1
      }
      tourSetStep(7); tourSetMinimized(false)
      queryClient.invalidateQueries()
    }
  }, [status?.status, tourSetStep, tourSetMinimized, queryClient])

  const handleFileChange = useCallback((idx: number, file: File | undefined) => {
    if (!file) return
    setFiles((prev) => ({ ...prev, [FILE_KEYS[idx]]: file }))
    setUploadErrors([])
  }, [])

  const allFilesReady = FILE_KEYS.every((k) => files[k] != null)
  const canStart = (useSample || allFilesReady) && !isRunning

  const handleStart = async () => {
    setStepTimes([]); prevStepRef.current = -1
    if (!useSample && allFilesReady) {
      setUploading(true)
      try {
        const result = await uploadPipelineFiles(files as Record<typeof FILE_KEYS[number], File>)
        if (!result.valid) { setUploadErrors(result.errors); setUploading(false); return }
      } catch { setUploadErrors(['Failed to upload files — check that the API is running.']); setUploading(false); return }
      setUploading(false)
    }
    try {
      await startPipeline(useSample)
      await refetch()
      queryClient.invalidateQueries()
    } catch {
      setUploadErrors(['Failed to start pipeline — make sure the API server is running.'])
    }
  }

  const handleReset = async () => {
    await resetPipeline()
    setFiles({}); setUseSample(true); setUploadErrors([]); setStepTimes([])
    prevStepRef.current = -1; tourSetActive(false)
    await refetch()
  }

  const stepLabels  = STEP_LABEL_KEYS.map(t)
  const currentStep = status?.step_idx ?? -1
  const pct         = status?.pct ?? 0
  const totalSteps  = STEP_LABEL_KEYS.length

  // ── TOP genres for mini bar chart ─────────────────────────────────────
  const topGenres = stats?.genres?.slice(0, 8) ?? []
  const maxGenreCount = Math.max(...topGenres.map((g) => g.count), 1)

  // ── Eval rows sorted by coverage desc ────────────────────────────────
  const evalRows = evaluation?.rows ?? []

  return (
    <div>
      <PageTitle
        title={t('page.upload.title')}
        subtitle={t('page.upload.subtitle')}
      />

      {/* ═══════════════════════════════════════════════════════════════ IDLE */}
      {isIdle && (
        <div className="space-y-6">

          {/* Data source selector */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Sample data — featured */}
            <button
              onClick={() => { setUseSample(true); setFiles({}) }}
              className="rounded-xl p-5 text-left transition-all duration-200 w-full"
              style={{
                background: useSample ? 'rgba(255,107,53,0.07)' : '#14141f',
                border: `2px solid ${useSample ? '#ff6b35' : '#25253a'}`,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Database size={18} style={{ color: useSample ? '#ff6b35' : '#6b6b8a' }} />
                    <h3 className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>Use Sample Data</h3>
                    {useSample && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(255,107,53,0.2)', color: '#ff6b35' }}>Selected</span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: '#6b6b8a' }}>Pre-generated synthetic dataset · no upload required</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Tracks', value: '10,000', icon: '🎵' },
                  { label: 'Artists', value: '800',  icon: '🎤' },
                  { label: 'Users', value: '500',    icon: '👤' },
                  { label: 'Listen Events', value: '50,000', icon: '🎧' },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-xs mb-1" style={{ color: '#6b6b8a' }}>{icon} {label}</p>
                    <p className="text-lg font-bold tabular-nums" style={{ color: useSample ? '#ff6b35' : '#e8e8f0' }}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="text-xs space-y-1" style={{ color: '#6b6b8a' }}>
                <p>· 15 genres · 1960–2025 release years</p>
                <p>· Power-law play count distribution · 9 audio features</p>
                <p>· Pipeline completes in ~60–90 seconds</p>
              </div>
            </button>

            {/* Upload CSVs */}
            <div
              className="rounded-xl p-5 transition-all duration-200 cursor-pointer"
              onClick={() => setUseSample(false)}
              style={{
                background: !useSample ? 'rgba(34,211,238,0.05)' : '#14141f',
                border: `2px solid ${!useSample ? '#22d3ee' : '#25253a'}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Upload size={18} style={{ color: !useSample ? '#22d3ee' : '#6b6b8a' }} />
                <h3 className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>Upload Your Own CSVs</h3>
                {!useSample && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(34,211,238,0.2)', color: '#22d3ee' }}>Selected</span>
                )}
              </div>
              <p className="text-xs mb-4" style={{ color: '#6b6b8a' }}>4 CSV files required · must match expected schema</p>
              <div className="space-y-2">
                {FILE_NAMES.map((name, idx) => {
                  const key  = FILE_KEYS[idx]
                  const file = files[key]
                  return (
                    <div key={name} className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); fileInputRefs.current[idx]?.click() }}
                        className="flex items-center gap-2 flex-1 rounded-lg px-3 py-2 text-xs text-left transition-all"
                        style={{
                          background: file ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${file ? '#34d399' : '#25253a'}`,
                          color: file ? '#34d399' : '#6b6b8a',
                        }}
                      >
                        {file ? <CheckCircle size={12} /> : <Upload size={12} />}
                        <span className="font-mono">{name}</span>
                        {file
                          ? <span className="ml-auto opacity-60">{(file.size / 1024).toFixed(0)} KB</span>
                          : <span className="ml-auto opacity-50 text-xs">{FILE_DESCS[idx]}</span>}
                      </button>
                      <input
                        ref={(el) => { fileInputRefs.current[idx] = el }}
                        type="file" accept=".csv" className="hidden"
                        onChange={(e) => handleFileChange(idx, e.target.files?.[0])}
                      />
                    </div>
                  )
                })}
              </div>
              {uploadErrors.length > 0 && (
                <div className="mt-3 p-2 rounded-lg text-xs space-y-1"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  {uploadErrors.map((e, i) => <p key={i} style={{ color: '#f87171' }}>{e}</p>)}
                </div>
              )}
            </div>
          </div>

          {/* Start button */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <button
                onClick={handleStart}
                disabled={!canStart || uploading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: canStart && !uploading ? 'linear-gradient(135deg, #ff6b35, #f7931e)' : '#25253a',
                  color: canStart && !uploading ? '#0d0d14' : '#6b6b8a',
                  cursor: canStart && !uploading ? 'pointer' : 'not-allowed',
                  boxShadow: canStart && !uploading ? '0 4px 20px rgba(255,107,53,0.35)' : 'none',
                }}
              >
                <Play size={16} />
                {uploading ? 'Uploading…' : 'Start Pipeline'}
              </button>
              {!canStart && !useSample && (
                <p className="text-xs" style={{ color: '#6b6b8a' }}>Upload all 4 CSV files or select sample data</p>
              )}
            </div>
            {uploadErrors.length > 0 && (
              <div className="p-2 rounded-lg text-xs space-y-1"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                {uploadErrors.map((e, i) => <p key={i} style={{ color: '#f87171' }}>{e}</p>)}
              </div>
            )}
          </div>

          {/* Pipeline steps preview */}
          <Card>
            <h4 className="text-xs font-semibold mb-4 tracking-wider" style={{ color: '#6b6b8a' }}>PIPELINE STEPS</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stepLabels.map((label, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg p-3"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1a1a2e' }}>
                  <span className="text-xl shrink-0">{STEP_ICONS[i]}</span>
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: '#e8e8f0' }}>Step {i + 1}</p>
                    <p className="text-xs leading-tight" style={{ color: '#6b6b8a' }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs mt-4" style={{ color: '#3a3a5c' }}>
              The Pipeline Journey panel will animate each step in real time → look for it in the bottom-right corner.
            </p>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ RUNNING */}
      {isRunning && (
        <div className="space-y-5">

          {/* Big progress */}
          <div className="rounded-xl p-6" style={{ background: '#14141f', border: '1px solid #25253a' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Loader size={20} className="animate-spin" style={{ color: '#ff6b35' }} />
                <h3 className="text-base font-semibold" style={{ color: '#e8e8f0' }}>Pipeline Running…</h3>
              </div>
              <span className="text-2xl font-bold tabular-nums" style={{ color: '#ff6b35' }}>{pct}%</span>
            </div>

            {/* Progress bar */}
            <div className="h-3 rounded-full my-4" style={{ background: '#0d0d14' }}>
              <div
                className="h-3 rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #ff6b35 0%, #f7931e 60%, #f7c59f 100%)' }}
              />
            </div>

            {/* Step indicator dots */}
            <div className="flex items-center gap-2 mb-3">
              {stepLabels.map((_, i) => {
                const done   = i < currentStep
                const active = i === currentStep
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                      style={{
                        background: done ? '#34d399' : active ? '#ff6b35' : '#25253a',
                        boxShadow: active ? '0 0 8px rgba(255,107,53,0.6)' : 'none',
                        transform: active ? 'scale(1.4)' : 'scale(1)',
                      }}
                    />
                    {i < stepLabels.length - 1 && (
                      <div className="h-px flex-1" style={{ background: i < currentStep ? '#34d399' : '#1a1a2e', width: 16 }} />
                    )}
                  </div>
                )
              })}
            </div>

            <p className="text-sm" style={{ color: '#ff6b35' }}>
              {STEP_ICONS[currentStep] ?? '⚙️'} {status?.step_name}
            </p>
          </div>

          {/* Two-column: steps + live log */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <h4 className="text-xs font-semibold mb-1 tracking-wider" style={{ color: '#6b6b8a' }}>STEPS</h4>
              {stepLabels.map((label, idx) => (
                <StepRow key={idx} idx={idx} currentStep={currentStep}
                  totalSteps={totalSteps} label={label} stepTimes={stepTimes} icon={STEP_ICONS[idx]} />
              ))}
            </Card>

            <Card>
              <h4 className="text-xs font-semibold mb-3 tracking-wider" style={{ color: '#6b6b8a' }}>LIVE LOG</h4>
              <div className="font-mono text-xs space-y-1 max-h-64 overflow-y-auto pr-1"
                style={{ color: '#6b6b8a' }}>
                {(status?.logs ?? []).slice(-30).map((line, i) => (
                  <p key={i} style={{
                    color: line.startsWith('ERROR') ? '#f87171'
                         : line.includes('✓')      ? '#34d399'
                         : '#6b6b8a',
                  }}>
                    {line}
                  </p>
                ))}
                {(!status?.logs || status.logs.length === 0) && (
                  <p style={{ color: '#3a3a5c' }}>Waiting for first log…</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ DONE */}
      {isDone && (
        <div className="space-y-6">

          {/* Success banner */}
          <div className="rounded-xl p-5 flex items-center gap-4"
            style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)' }}>
            <CheckCircle size={32} style={{ color: '#34d399' }} className="shrink-0" />
            <div className="flex-1">
              <h3 className="text-base font-bold mb-0.5" style={{ color: '#34d399' }}>Pipeline Complete!</h3>
              <p className="text-xs" style={{ color: '#6b6b8a' }}>
                All 6 steps finished · Total time: <strong style={{ color: '#e8e8f0' }}>{status.elapsed_s}s</strong>
                {' '}· {status.used_sample ? 'Sample data' : 'Uploaded data'}
              </p>
            </div>
            <Button variant="ghost" onClick={handleReset}>Run Again</Button>
          </div>

          {/* Dataset stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Tracks',        value: stats.tracks.toLocaleString(),   icon: <Music size={18} />,      color: '#ff6b35' },
                { label: 'Artists',       value: stats.artists.toLocaleString(),  icon: <Headphones size={18} />, color: '#22d3ee' },
                { label: 'Users',         value: stats.users.toLocaleString(),    icon: <Users size={18} />,      color: '#a78bfa' },
                { label: 'Listen Events', value: stats.listens.toLocaleString(),  icon: <Zap size={18} />,        color: '#34d399' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="rounded-xl p-4" style={{ background: '#14141f', border: '1px solid #25253a' }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color }}>
                    {icon}
                    <p className="text-xs" style={{ color: '#6b6b8a' }}>{label}</p>
                  </div>
                  <p className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Step completion + Model evaluation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Step times */}
            <Card>
              <h4 className="text-xs font-semibold mb-3 tracking-wider flex items-center gap-2" style={{ color: '#6b6b8a' }}>
                <Clock size={12} /> STEP COMPLETION
              </h4>
              {stepLabels.map((label, idx) => (
                <StepRow key={idx} idx={idx} currentStep={totalSteps + 1}
                  totalSteps={totalSteps} label={label} stepTimes={stepTimes} icon={STEP_ICONS[idx]} />
              ))}
              <div className="mt-3 pt-3 flex justify-between text-xs" style={{ borderTop: '1px solid #1a1a2e' }}>
                <span style={{ color: '#6b6b8a' }}>Total pipeline time</span>
                <span className="font-bold tabular-nums" style={{ color: '#34d399' }}>{status.elapsed_s}s</span>
              </div>
            </Card>

            {/* Model evaluation */}
            <Card>
              <h4 className="text-xs font-semibold mb-3 tracking-wider flex items-center gap-2" style={{ color: '#6b6b8a' }}>
                <BarChart3 size={12} /> MODEL METRICS
              </h4>
              {evalRows.length > 0 ? (
                <div className="space-y-3">
                  {evalRows.map((row) => {
                    const color    = MODEL_COLORS[row.model] ?? '#888'
                    const coverage  = Number(row.coverage  ?? 0) * 100
                    const novelty   = Number(row.novelty   ?? 0)
                    const diversity = Number(row.diversity ?? 0)
                    return (
                      <div key={row.model}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium" style={{ color }}>
                            {MODEL_LABELS[row.model] ?? row.model}
                          </span>
                          <div className="flex gap-3 text-xs tabular-nums" style={{ color: '#6b6b8a' }}>
                            <span>Cov <strong style={{ color: '#e8e8f0' }}>{(coverage).toFixed(1)}%</strong></span>
                            <span>Nov <strong style={{ color: '#e8e8f0' }}>{novelty.toFixed(1)}</strong></span>
                            <span>Div <strong style={{ color: '#e8e8f0' }}>{diversity.toFixed(2)}</strong></span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: '#1a1a2e' }}>
                          <div className="h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min(coverage * 2, 100)}%`, background: color }} />
                        </div>
                      </div>
                    )
                  })}
                  <p className="text-xs pt-1" style={{ color: '#3a3a5c' }}>
                    Coverage = % of catalog recommended · Novelty = avg item rarity · Diversity = avg pairwise distance
                  </p>
                </div>
              ) : (
                <p className="text-xs" style={{ color: '#6b6b8a' }}>Evaluation data loading…</p>
              )}
            </Card>
          </div>

          {/* Genre distribution + Top tracks */}
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Genre mini bar chart */}
              <Card>
                <h4 className="text-xs font-semibold mb-3 tracking-wider" style={{ color: '#6b6b8a' }}>GENRE DISTRIBUTION</h4>
                <div className="space-y-2">
                  {topGenres.map((g) => (
                    <div key={g.genre}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: '#e8e8f0' }}>{g.genre}</span>
                        <span className="tabular-nums" style={{ color: '#6b6b8a' }}>{g.count.toLocaleString()} tracks</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: '#1a1a2e' }}>
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${(g.count / maxGenreCount) * 100}%`,
                            background: seqColor(g.count / maxGenreCount),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Top tracks */}
              <Card>
                <h4 className="text-xs font-semibold mb-3 tracking-wider flex items-center gap-2" style={{ color: '#6b6b8a' }}>
                  <TrendingUp size={12} /> TOP TRACKS BY PLAY COUNT
                </h4>
                <div className="space-y-2">
                  {stats.top_tracks.slice(0, 6).map((track, i) => (
                    <div key={track.track_id} className="flex items-center gap-3 py-1.5"
                      style={{ borderBottom: i < 5 ? '1px solid #1a1a2e' : 'none' }}>
                      <span className="text-xs font-bold tabular-nums w-4 text-right shrink-0"
                        style={{ color: i < 3 ? '#ff6b35' : '#6b6b8a' }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: '#e8e8f0' }}>{track.title}</p>
                        <p className="text-xs truncate" style={{ color: '#6b6b8a' }}>{track.artist_name} · {track.genre}</p>
                      </div>
                      <span className="text-xs tabular-nums shrink-0" style={{ color: '#6b6b8a' }}>
                        {(track.play_count / 1000).toFixed(0)}K
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Navigation cards */}
          <div>
            <h4 className="text-xs font-semibold mb-4 tracking-wider" style={{ color: '#6b6b8a' }}>EXPLORE THE RESULTS</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <DestCard icon={<Music size={16} />} color="#ff6b35"
                title="Personalized Recommendations"
                desc="Try Popularity · ALS · Content-based · Hybrid for any user"
                onClick={() => navigate('/recommend')} />
              <DestCard icon={<Search size={16} />} color="#22d3ee"
                title="Track Search"
                desc="BM25 keyword · Vector semantic · Hybrid RRF fusion"
                onClick={() => navigate('/search')} />
              <DestCard icon={<Zap size={16} />} color="#a78bfa"
                title="Similar Songs"
                desc="FAISS vector index · Cosine similarity Top-K"
                onClick={() => navigate('/similar')} />
              <DestCard icon={<Network size={16} />} color="#34d399"
                title="Artist Network"
                desc="Force-directed graph · Louvain community detection"
                onClick={() => navigate('/artists')} />
              <DestCard icon={<BarChart3 size={16} />} color="#f59e0b"
                title="Model Evaluation"
                desc="P@K · MAP · nDCG · Coverage · Novelty · Diversity"
                onClick={() => navigate('/evaluation')} />
              <DestCard icon={<Globe size={16} />} color="#ec4899"
                title="Analytics Suite"
                desc="DNA · Disagreement · Bias · Cohorts · Geography · Patterns"
                onClick={() => navigate('/analytics/patterns')} />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ ERROR */}
      {isError && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-start gap-3">
              <AlertCircle size={20} style={{ color: '#f87171' }} className="shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: '#f87171' }}>Pipeline Error</h3>
                <p className="text-xs font-mono" style={{ color: '#6b6b8a' }}>{status?.error}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleReset} className="mt-4">Reset & Try Again</Button>
          </Card>
          {status?.logs && status.logs.length > 0 && (
            <Card>
              <h4 className="text-xs font-semibold mb-2" style={{ color: '#6b6b8a' }}>ERROR LOG</h4>
              <div className="font-mono text-xs space-y-0.5 max-h-48 overflow-y-auto" style={{ color: '#6b6b8a' }}>
                {status.logs.map((line, i) => (
                  <p key={i} style={{ color: line.startsWith('ERROR') || line.startsWith('PIPELINE') ? '#f87171' : '#6b6b8a' }}>
                    {line}
                  </p>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
