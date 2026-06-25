import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtDuration(ms?: number): string {
  if (!ms) return '—'
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function pct(v?: number): string {
  if (v == null) return '—'
  return `${Math.round(v * 100)}%`
}

export const GENRE_COLORS: Record<string, string> = {
  Pop: '#ff6b35',
  Rock: '#e55a25',
  'Hip-Hop': '#f7c59f',
  Electronic: '#22d3ee',
  Jazz: '#6b6b8a',
  Classical: '#a78bfa',
  'R&B': '#fb923c',
  Country: '#fbbf24',
  Indie: '#34d399',
  Metal: '#f87171',
  Blues: '#60a5fa',
  Reggae: '#4ade80',
  Folk: '#e879f9',
  Ambient: '#818cf8',
  Alternative: '#f472b6',
}

export function genreColor(genre?: string): string {
  return GENRE_COLORS[genre ?? ''] ?? '#6b6b8a'
}
