import { useEffect, useRef } from 'react'
import { useTourStore } from '@/store/tourStore'

/**
 * Register tour anchors for a page. When the tour's pendingAnchor matches one
 * of the provided anchor IDs, scrolls to it, applies the spotlight, and clears
 * the pending state.
 */
export function useTourAnchor(anchorIds: string[]) {
  const { pendingAnchor, clearPendingAnchor, isActive } = useTourStore()
  const prevActiveAnchor = useRef<string>('')

  useEffect(() => {
    if (!isActive || !pendingAnchor) return
    if (!anchorIds.includes(pendingAnchor)) return

    // Small delay so the page can finish rendering after navigation
    const timer = setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-tour-anchor="${pendingAnchor}"]`)
      if (!el) return

      // Remove previous spotlight
      if (prevActiveAnchor.current) {
        const prev = document.querySelector<HTMLElement>(
          `[data-tour-anchor="${prevActiveAnchor.current}"]`
        )
        if (prev) prev.removeAttribute('data-tour-active')
      }

      // Apply spotlight to new element
      el.setAttribute('data-tour-active', 'true')
      prevActiveAnchor.current = pendingAnchor
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      clearPendingAnchor()
    }, 120)

    return () => clearTimeout(timer)
  }, [pendingAnchor, isActive, anchorIds, clearPendingAnchor])

  // Clean up spotlight when tour deactivates
  useEffect(() => {
    if (!isActive && prevActiveAnchor.current) {
      const el = document.querySelector<HTMLElement>(
        `[data-tour-anchor="${prevActiveAnchor.current}"]`
      )
      if (el) el.removeAttribute('data-tour-active')
      prevActiveAnchor.current = ''
    }
  }, [isActive])
}
