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
        set((state) => ({
          token: session.token,
          user: session.user,
          role: session.role,
          memberships: session.memberships,
          activeOrganizationId: resolveActiveOrganizationId(
            session.activeOrganizationId,
            session.memberships,
            state.activeOrganizationId,
            session.role,
          ),
        })),
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
      // Bug fix: previously only set `activeOrganizationId`, leaving `role` (used for nav-item and
      // button gating throughout the app, e.g. AppShell's canAccessNavigationItem) stuck at
      // whichever org's role was last synced via setSession/syncProfile — those only run at
      // login or on a /me refetch, neither of which this org-switcher call triggers. A multi-org
      // user switching from an org where they're ORG_ADMIN to one where they're merely STAFF would
      // keep seeing admin-gated nav/buttons for the new org until the next /me refetch (up to
      // useMeQuery's 60s staleTime, or a full reload). The backend independently re-derives role
      // per request (see requireOrganizationContext), so this was never an actual privilege
      // escalation — but it is a real, reproducible UI-correctness gap. Resolves `role` from the
      // already-known `memberships` array, same source resolveActiveOrganizationId already trusts,
      // so it can't disagree with what a following /me refetch would set anyway. SUPER_ADMIN has no
      // per-org membership role to look up (see resolveActiveOrganizationId's own SUPER_ADMIN
      // special-case above) and keeps its existing role unchanged.
      setActiveOrganizationId: (activeOrganizationId) =>
        set((state) => {
          if (state.role === 'SUPER_ADMIN') {
            return { activeOrganizationId }
          }

          const membership = state.memberships.find(
            (candidate) => candidate.organizationId === activeOrganizationId,
          )

          return {
            activeOrganizationId,
            role: membership?.role ?? state.role,
          }
        }),
      clearSession: () => set(initialState),
    }),
    {
      name: 'nearcart-auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
