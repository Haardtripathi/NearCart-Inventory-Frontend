import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import type { PaginatedResponse } from '@/types/api'
import type { StockTransferStatus } from '@/types/common'
import type { StockTransfer, StockTransferPayload } from '@/types/inventory'

export interface StockTransferFilters {
  page?: number
  limit?: number
  search?: string
  fromBranchId?: string
  toBranchId?: string
  status?: StockTransferStatus
}

export const stockTransfersKeys = {
  list: (organizationId: string | null, filters: StockTransferFilters) =>
    ['stock-transfers', organizationId, filters] as const,
  detail: (id: string) => ['stock-transfers', id] as const,
}

export function useStockTransfersQuery(filters: StockTransferFilters) {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return useQuery({
    queryKey: stockTransfersKeys.list(activeOrganizationId, filters),
    queryFn: async () =>
      unwrapResponse<PaginatedResponse<StockTransfer>>(api.get('/stock-transfers', { params: filters })),
    enabled: Boolean(activeOrganizationId),
  })
}

export function useStockTransferQuery(id?: string) {
  return useQuery({
    queryKey: stockTransfersKeys.detail(id ?? 'unknown'),
    queryFn: async () => unwrapResponse<StockTransfer>(api.get(`/stock-transfers/${id}`)),
    enabled: Boolean(id),
  })
}

export function useCreateStockTransferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: StockTransferPayload) =>
      unwrapResponse<StockTransfer>(api.post('/stock-transfers', payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['stock-transfers'] })
    },
  })
}

export function useUpdateStockTransferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<StockTransferPayload> }) =>
      unwrapResponse<StockTransfer>(api.patch(`/stock-transfers/${id}`, payload)),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stock-transfers'] }),
        queryClient.invalidateQueries({ queryKey: stockTransfersKeys.detail(variables.id) }),
      ])
    },
  })
}

export function useApproveStockTransferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) =>
      unwrapResponse<StockTransfer>(api.post(`/stock-transfers/${id}/approve`)),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stock-transfers'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: stockTransfersKeys.detail(id) }),
      ])
    },
  })
}

export function useCancelStockTransferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) =>
      unwrapResponse<StockTransfer>(api.post(`/stock-transfers/${id}/cancel`)),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stock-transfers'] }),
        queryClient.invalidateQueries({ queryKey: stockTransfersKeys.detail(id) }),
      ])
    },
  })
}
