import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import type { PaginatedResponse } from '@/types/api'
import type { PurchasePayload, PurchaseReceipt } from '@/types/inventory'
import type { PurchaseStatus } from '@/types/common'

export interface PurchaseFilters {
  page?: number
  limit?: number
  search?: string
  branchId?: string
  supplierId?: string
  status?: PurchaseStatus
}

export const purchasesKeys = {
  list: (organizationId: string | null, filters: PurchaseFilters) => ['purchases', organizationId, filters] as const,
  detail: (id: string) => ['purchases', id] as const,
}

export function usePurchasesQuery(filters: PurchaseFilters) {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return useQuery({
    queryKey: purchasesKeys.list(activeOrganizationId, filters),
    queryFn: async () => unwrapResponse<PaginatedResponse<PurchaseReceipt>>(api.get('/purchases', { params: filters })),
    enabled: Boolean(activeOrganizationId),
  })
}

export function usePurchaseQuery(id?: string) {
  return useQuery({
    queryKey: purchasesKeys.detail(id ?? 'unknown'),
    queryFn: async () => unwrapResponse<PurchaseReceipt>(api.get(`/purchases/${id}`)),
    enabled: Boolean(id),
  })
}

export function useCreatePurchaseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: PurchasePayload) =>
      unwrapResponse<PurchaseReceipt>(api.post('/purchases', payload)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['purchases'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
      ])
    },
  })
}

export function useUpdatePurchaseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<PurchasePayload> }) =>
      unwrapResponse<PurchaseReceipt>(api.patch(`/purchases/${id}`, payload)),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['purchases'] }),
        queryClient.invalidateQueries({ queryKey: purchasesKeys.detail(variables.id) }),
      ])
    },
  })
}

export function usePostPurchaseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => unwrapResponse<PurchaseReceipt>(api.post(`/purchases/${id}/post`)),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['purchases'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: purchasesKeys.detail(id) }),
      ])
    },
  })
}
