// Multi-stop perceptual color scales for heatmaps and charts.
// All stops use the app's dark theme palette.

type RGB = [number, number, number]

function lerp(a: RGB, b: RGB, t: number): string {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`
}

function multiStop(stops: RGB[], t: number): string {
  const clamped = Math.max(0, Math.min(1, t))
  const pos = clamped * (stops.length - 1)
  const lo = Math.floor(pos)
  const hi = Math.min(lo + 1, stops.length - 1)
  return lerp(stops[lo]!, stops[hi]!, pos - lo)
}

// Sequential: background-black → navy → teal → amber → brand-orange
// Gives 5 visually distinct bands so 20%, 40%, 60%, 80% are easy to tell apart
const SEQ_STOPS: RGB[] = [
  [0x0d, 0x0d, 0x14],  // 0.00 — background black
  [0x1e, 0x3a, 0x5f],  // 0.25 — deep navy
  [0x0e, 0x74, 0x90],  // 0.50 — teal (cyan-700)
  [0xd9, 0x77, 0x06],  // 0.75 — amber
  [0xff, 0x6b, 0x35],  // 1.00 — brand orange
]

/** t ∈ [0, 1] → sequential color: black → navy → teal → amber → orange */
export function seqColor(t: number): string {
  return multiStop(SEQ_STOPS, t)
}

// Diverging: for correlation matrices (-1 → 0 → +1)
// Negative: brand-cyan → dark-teal → near-black
// Positive: near-black → dark-rust → brand-orange
const DIV_NEG: RGB[] = [
  [0x22, 0xd3, 0xee],  // -1.0 — brand cyan
  [0x0e, 0x4f, 0x6e],  // -0.5 — dark teal
  [0x1a, 0x1a, 0x2e],  //  0.0 — near black
]
const DIV_POS: RGB[] = [
  [0x1a, 0x1a, 0x2e],  //  0.0 — near black
  [0x7c, 0x2d, 0x12],  // +0.5 — dark rust
  [0xff, 0x6b, 0x35],  // +1.0 — brand orange
]

/** v ∈ [-1, 1] → diverging color: cyan (neg) ↔ dark (zero) ↔ orange (pos) */
export function divColor(v: number): string {
  if (isNaN(v)) return '#1a1a2e'
  const clamped = Math.max(-1, Math.min(1, v))
  const t = Math.abs(clamped)
  return multiStop(clamped <= 0 ? DIV_NEG : DIV_POS, t)
}

// Categorical rank colors — distinct brand palette for ordered bars/items
export const RANK_COLORS: readonly string[] = [
  '#ff6b35',  // orange (rank 1)
  '#f59e0b',  // amber  (rank 2)
  '#22d3ee',  // cyan   (rank 3)
  '#a78bfa',  // purple (rank 4)
  '#34d399',  // green  (rank 5)
  '#f87171',  // red    (rank 6)
  '#60a5fa',  // blue   (rank 7)
  '#e879f9',  // pink   (rank 8)
]

/** Returns a distinct brand color for rank i (wraps after 8) */
export function rankColor(i: number): string {
  return RANK_COLORS[i % RANK_COLORS.length] ?? '#6b6b8a'
}

/** Decide text color (light vs dark) based on sequential value */
export function seqTextColor(t: number): string {
  // t < 0.55 → teal/navy are dark enough for light text
  // t ≥ 0.55 → amber/orange are bright enough to use dark text
  return t >= 0.55 ? '#0d0d14' : '#e8e8f0'
}
