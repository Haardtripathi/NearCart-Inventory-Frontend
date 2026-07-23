import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'

export interface SidebarModuleDefinition {
  key: string
  label: string
  description: string
  defaultEnabled: boolean
}

export interface EnabledPagesResponse {
  enabledPages: Record<string, boolean>
  modules: SidebarModuleDefinition[]
}

export const pageVisibilityKeys = {
  current: (organizationId: string | null) => ['organizations', 'page-visibility', organizationId] as const,
}

export function usePageVisibilityQuery() {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return useQuery({
    queryKey: pageVisibilityKeys.current(activeOrganizationId),
    queryFn: async () => unwrapResponse<EnabledPagesResponse>(api.get('/organizations/page-visibility')),
    enabled: Boolean(activeOrganizationId),
    staleTime: 30_000,
  })
}

export function useUpdatePageVisibilityMutation() {
  const queryClient = useQueryClient()
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return useMutation({
    mutationFn: async (patch: Record<string, boolean>) =>
      unwrapResponse<EnabledPagesResponse>(api.patch('/organizations/page-visibility', { enabledPages: patch })),
    onSuccess: async (data) => {
      queryClient.setQueryData(pageVisibilityKeys.current(activeOrganizationId), data)
      await queryClient.invalidateQueries({ queryKey: pageVisibilityKeys.current(activeOrganizationId) })
    },
  })
}
