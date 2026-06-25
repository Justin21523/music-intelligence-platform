import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Lang = 'zh' | 'en'

interface LangState {
  lang: Lang
  setLang: (l: Lang) => void
  toggleLang: () => void
}

export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      lang: 'zh',
      setLang: (l) => set({ lang: l }),
      toggleLang: () => set({ lang: get().lang === 'zh' ? 'en' : 'zh' }),
    }),
    { name: 'mip-lang' },
  ),
)
