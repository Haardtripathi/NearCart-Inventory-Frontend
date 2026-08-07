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

// New orders land here via the marketplace bridge / walk-in entry without any action from
// whoever has this list open — the global QueryClient default (`refetchOnWindowFocus: false`,
// no interval, see lib/queryClient.ts) meant a staff member watching this screen would never see
// a new order appear on its own, not even by tabbing back to the browser. Overridden per-query
// here (not globally) so unrelated screens keep the quieter default. 20s keeps it comfortably
// above the "avoid sub-10s polling" guidance.
const SALES_ORDERS_POLL_INTERVAL_MS = 20_000

export function useSalesOrdersQuery(filters: SalesOrderFilters) {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return useQuery({
    queryKey: salesOrdersKeys.list(activeOrganizationId, filters),
    queryFn: async () =>
      unwrapResponse<PaginatedResponse<SalesOrder>>(api.get('/sales-orders', { params: filters })),
    enabled: Boolean(activeOrganizationId),
    refetchInterval: SALES_ORDERS_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  })
}

export function useSalesOrderQuery(id?: string) {
  return useQuery({
    queryKey: salesOrdersKeys.detail(id ?? 'unknown'),
    queryFn: async () => unwrapResponse<SalesOrder>(api.get(`/sales-orders/${id}`)),
    enabled: Boolean(id),
    // A single order's detail page is exactly where a staff member watches for the next status
    // change (confirm -> ready -> driver assigned -> out for delivery -> delivered) — same
    // rationale as the list query above, just a shorter interval since there's only one row to
    // fetch and the payoff (seeing "driver assigned" appear live) matters more here.
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
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

// CONFIRMED -> READY. Per PHASE1_REQUIREMENTS.md "Driver API contract":
// `PATCH /api/sales-orders/:id/mark-ready`.
export function useMarkSalesOrderReadyMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => unwrapResponse<SalesOrder>(api.patch(`/sales-orders/${id}/mark-ready`)),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sales-orders'] }),
        queryClient.invalidateQueries({ queryKey: salesOrdersKeys.detail(id) }),
      ])
    },
  })
}

// Requires status READY. Per PHASE1_REQUIREMENTS.md: `POST /api/sales-orders/:id/assign-driver`
// with body `{ driverId }`, sets `assignedDriverId`.
export function useAssignSalesOrderDriverMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, driverId }: { id: string; driverId: string }) =>
      unwrapResponse<SalesOrder>(api.post(`/sales-orders/${id}/assign-driver`, { driverId })),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sales-orders'] }),
        queryClient.invalidateQueries({ queryKey: salesOrdersKeys.detail(variables.id) }),
      ])
    },
  })
}
