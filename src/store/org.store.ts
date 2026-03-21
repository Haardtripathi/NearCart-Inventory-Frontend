import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface OrgState {
  activeBranchId: string | null
  setActiveBranchId: (branchId: string | null) => void
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set) => ({
      activeBranchId: null,
      setActiveBranchId: (activeBranchId) => set({ activeBranchId }),
    }),
    {
      name: 'nearcart-org',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
