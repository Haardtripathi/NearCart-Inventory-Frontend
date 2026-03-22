import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type { AuthSession, AuthUser, MeResponse, OrganizationMembership } from '@/types/auth'
import type { UserRole } from '@/types/common'

interface AuthState {
  token: string | null
  user: AuthUser | null
  role: UserRole | null
  memberships: OrganizationMembership[]
  activeOrganizationId: string | null
  setSession: (session: AuthSession) => void
  syncProfile: (profile: MeResponse) => void
  updateUser: (user: AuthUser) => void
  setActiveOrganizationId: (organizationId: string | null) => void
  clearSession: () => void
}

function resolveActiveOrganizationId(
  requestedOrganizationId: string | null | undefined,
  memberships: OrganizationMembership[],
  fallbackOrganizationId?: string | null,
  role?: UserRole | null,
) {
  const membershipIds = new Set(memberships.map((membership) => membership.organizationId))

  if (role === 'SUPER_ADMIN') {
    return requestedOrganizationId ?? fallbackOrganizationId ?? null
  }

  if (requestedOrganizationId && membershipIds.has(requestedOrganizationId)) {
    return requestedOrganizationId
  }

  if (fallbackOrganizationId && membershipIds.has(fallbackOrganizationId)) {
    return fallbackOrganizationId
  }

  return memberships.find((membership) => membership.isDefault)?.organizationId ?? memberships[0]?.organizationId ?? null
}

const initialState = {
  token: null,
  user: null,
  role: null,
  memberships: [] as OrganizationMembership[],
  activeOrganizationId: null,
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      setSession: (session) =>
        set({
          token: session.token,
          user: session.user,
          role: session.role,
          memberships: session.memberships,
          activeOrganizationId: resolveActiveOrganizationId(
            session.activeOrganizationId,
            session.memberships,
            undefined,
            session.role,
          ),
        }),
      syncProfile: (profile) =>
        set((state) => ({
          user: {
            id: profile.id,
            fullName: profile.fullName,
            email: profile.email,
            isActive: profile.isActive,
            platformRole: profile.platformRole,
            preferredLanguage: profile.preferredLanguage,
            lastLoginAt: profile.lastLoginAt,
          },
          role: profile.role,
          memberships: profile.memberships,
          activeOrganizationId: resolveActiveOrganizationId(
            profile.activeOrganizationId,
            profile.memberships,
            state.activeOrganizationId,
            profile.role,
          ),
        })),
      updateUser: (user) =>
        set((state) => ({
          user: {
            ...state.user,
            ...user,
          },
        })),
      setActiveOrganizationId: (activeOrganizationId) => set({ activeOrganizationId }),
      clearSession: () => set(initialState),
    }),
    {
      name: 'nearcart-auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
