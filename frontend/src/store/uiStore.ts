import { create } from 'zustand'
import type { ModelName, SearchMode } from '@/types/api'

interface UIState {
  searchMode: SearchMode
  setSearchMode: (m: SearchMode) => void
  selectedModel: ModelName
  setSelectedModel: (m: ModelName) => void
  selectedUserId: string
  setSelectedUserId: (id: string) => void
  selectedArtistId: string
  setSelectedArtistId: (id: string) => void
  selectedTrackId: string
  setSelectedTrackId: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  searchMode: 'bm25',
  setSearchMode: (searchMode) => set({ searchMode }),
  selectedModel: 'hybrid',
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  selectedUserId: 'U0001',
  setSelectedUserId: (selectedUserId) => set({ selectedUserId }),
  selectedArtistId: '',
  setSelectedArtistId: (selectedArtistId) => set({ selectedArtistId }),
  selectedTrackId: '',
  setSelectedTrackId: (selectedTrackId) => set({ selectedTrackId }),
}))
