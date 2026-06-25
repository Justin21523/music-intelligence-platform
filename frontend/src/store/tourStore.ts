import { create } from 'zustand'

interface TourState {
  isActive: boolean
  isMinimized: boolean
  isFullscreen: boolean
  currentStep: number
  pendingAnchor: string
  setActive: (v: boolean) => void
  setMinimized: (v: boolean) => void
  setFullscreen: (v: boolean) => void
  setStep: (n: number) => void
  setPendingAnchor: (a: string) => void
  clearPendingAnchor: () => void
  nextStep: () => void
  prevStep: () => void
}

const TOTAL_STEPS = 22

export const useTourStore = create<TourState>((set, get) => ({
  isActive: false,
  isMinimized: false,
  isFullscreen: false,
  currentStep: 0,
  pendingAnchor: '',

  setActive: (isActive) => set({ isActive, isMinimized: false }),
  setMinimized: (isMinimized) => set({ isMinimized }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setStep: (currentStep) => set({ currentStep }),
  setPendingAnchor: (pendingAnchor) => set({ pendingAnchor }),
  clearPendingAnchor: () => set({ pendingAnchor: '' }),
  nextStep: () => {
    const { currentStep } = get()
    if (currentStep < TOTAL_STEPS - 1) set({ currentStep: currentStep + 1 })
  },
  prevStep: () => {
    const { currentStep } = get()
    if (currentStep > 0) set({ currentStep: currentStep - 1 })
  },
}))
