import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import type { PaginatedResponse } from '@/types/api'
import type { PaymentStatus, OrderSource, SalesOrderStatus } from '@/types/common'
import type { SalesOrder, SalesOrderPayload } from '@/types/inventory'

export interface SalesOrderFilters {
  page?: number
  limit?: number
  search?: string
  branchId?: string
  customerId?: string
  status?: SalesOrderStatus
  paymentStatus?: PaymentStatus
  source?: OrderSource
}

export const salesOrdersKeys = {
  list: (organizationId: string | null, filters: SalesOrderFilters) => ['sales-orders', organizationId, filters] as const,
  detail: (id: string) => ['sales-orders', id] as const,
}

export function useSalesOrdersQuery(filters: SalesOrderFilters) {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return useQuery({
    queryKey: salesOrdersKeys.list(activeOrganizationId, filters),
    queryFn: async () =>
      unwrapResponse<PaginatedResponse<SalesOrder>>(api.get('/sales-orders', { params: filters })),
    enabled: Boolean(activeOrganizationId),
  })
}

export function useSalesOrderQuery(id?: string) {
  return useQuery({
    queryKey: salesOrdersKeys.detail(id ?? 'unknown'),
    queryFn: async () => unwrapResponse<SalesOrder>(api.get(`/sales-orders/${id}`)),
    enabled: Boolean(id),
  })
}

export function useCreateSalesOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SalesOrderPayload) =>
      unwrapResponse<SalesOrder>(api.post('/sales-orders', payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
    },
  })
}

export function useUpdateSalesOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<SalesOrderPayload> }) =>
      unwrapResponse<SalesOrder>(api.patch(`/sales-orders/${id}`, payload)),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sales-orders'] }),
        queryClient.invalidateQueries({ queryKey: salesOrdersKeys.detail(variables.id) }),
      ])
    },
  })
}

export function useConfirmSalesOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => unwrapResponse<SalesOrder>(api.post(`/sales-orders/${id}/confirm`)),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sales-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: salesOrdersKeys.detail(id) }),
      ])
    },
  })
}

export function useRejectSalesOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, rejectionReason }: { id: string; rejectionReason: string }) =>
      unwrapResponse<SalesOrder>(api.post(`/sales-orders/${id}/reject`, { rejectionReason })),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sales-orders'] }),
        queryClient.invalidateQueries({ queryKey: salesOrdersKeys.detail(variables.id) }),
      ])
    },
  })
}

export function useCancelSalesOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => unwrapResponse<SalesOrder>(api.post(`/sales-orders/${id}/cancel`)),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sales-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: salesOrdersKeys.detail(id) }),
      ])
    },
  })
}

export function useDeliverSalesOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => unwrapResponse<SalesOrder>(api.post(`/sales-orders/${id}/deliver`)),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sales-orders'] }),
        queryClient.invalidateQueries({ queryKey: salesOrdersKeys.detail(id) }),
      ])
    },
  })
}
