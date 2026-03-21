import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import type { PaginatedResponse } from '@/types/api'
import type { Supplier } from '@/types/common'

export interface SupplierFilters {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

export const suppliersKeys = {
  list: (organizationId: string | null, filters: SupplierFilters) => ['suppliers', organizationId, filters] as const,
  detail: (id: string) => ['suppliers', id] as const,
}

export function useSuppliersQuery(filters: SupplierFilters) {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return useQuery({
    queryKey: suppliersKeys.list(activeOrganizationId, filters),
    queryFn: async () => unwrapResponse<PaginatedResponse<Supplier>>(api.get('/suppliers', { params: filters })),
    enabled: Boolean(activeOrganizationId),
  })
}

export function useSupplierQuery(id?: string) {
  return useQuery({
    queryKey: suppliersKeys.detail(id ?? 'unknown'),
    queryFn: async () => unwrapResponse<Supplier>(api.get(`/suppliers/${id}`)),
    enabled: Boolean(id),
  })
}

export function useCreateSupplierMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Partial<Supplier>) =>
      unwrapResponse<Supplier>(api.post('/suppliers', payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
}

export function useUpdateSupplierMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Supplier> }) =>
      unwrapResponse<Supplier>(api.patch(`/suppliers/${id}`, payload)),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
        queryClient.invalidateQueries({ queryKey: suppliersKeys.detail(variables.id) }),
      ])
    },
  })
}

export function useDeleteSupplierMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => unwrapResponse<Supplier>(api.delete(`/suppliers/${id}`)),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
        queryClient.invalidateQueries({ queryKey: suppliersKeys.detail(id) }),
      ])
    },
  })
}
