import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type { AppLanguage } from '@/types/common'

interface UiState {
  sidebarOpen: boolean
  language: AppLanguage
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setLanguage: (language: AppLanguage) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      language: 'en',
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'nearcart-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        language: state.language,
      }),
    },
  ),
)
