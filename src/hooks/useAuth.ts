import { useAuthStore } from '@/store/auth.store'

export function useAuth() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const role = useAuthStore((state) => state.role)
  const memberships = useAuthStore((state) => state.memberships)
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return {
    token,
    user,
    role,
    memberships,
    activeOrganizationId,
    isAuthenticated: Boolean(token && user),
  }
}
