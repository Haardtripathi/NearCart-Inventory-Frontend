import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import type { PaginatedResponse } from '@/types/api'
import type { Branch } from '@/types/common'

export interface BranchFilters {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

export const branchesKeys = {
  list: (organizationId: string | null, filters: BranchFilters) => ['branches', organizationId, filters] as const,
  detail: (id: string) => ['branches', id] as const,
}

export function useBranchesQuery(filters: BranchFilters) {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return useQuery({
    queryKey: branchesKeys.list(activeOrganizationId, filters),
    queryFn: async () => unwrapResponse<PaginatedResponse<Branch>>(api.get('/branches', { params: filters })),
    enabled: Boolean(activeOrganizationId),
  })
}

export function useBranchQuery(id?: string) {
  return useQuery({
    queryKey: branchesKeys.detail(id ?? 'unknown'),
    queryFn: async () => unwrapResponse<Branch>(api.get(`/branches/${id}`)),
    enabled: Boolean(id),
  })
}

export function useCreateBranchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Partial<Branch>) => unwrapResponse<Branch>(api.post('/branches', payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['branches'] })
    },
  })
}

export function useUpdateBranchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Branch> }) =>
      unwrapResponse<Branch>(api.patch(`/branches/${id}`, payload)),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['branches'] }),
        queryClient.invalidateQueries({ queryKey: branchesKeys.detail(variables.id) }),
      ])
    },
  })
}

export function useDeleteBranchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => unwrapResponse<Branch>(api.delete(`/branches/${id}`)),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['branches'] }),
        queryClient.invalidateQueries({ queryKey: branchesKeys.detail(id) }),
      ])
    },
  })
}
