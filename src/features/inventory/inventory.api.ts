import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import type { PaginatedResponse } from '@/types/api'
import type { InventoryBalance, InventoryLedgerEntry, StockAdjustmentPayload } from '@/types/inventory'
import type { StockMovementType } from '@/types/common'

export interface InventoryBalanceFilters {
  page?: number
  limit?: number
  search?: string
  branchId?: string
  productId?: string
  variantId?: string
  lowStock?: boolean
}

export interface InventoryLedgerFilters {
  page?: number
  limit?: number
  search?: string
  branchId?: string
  productId?: string
  variantId?: string
  movementType?: StockMovementType
  startDate?: string
  endDate?: string
}

export const inventoryKeys = {
  balances: (organizationId: string | null, filters: InventoryBalanceFilters) =>
    ['inventory', 'balances', organizationId, filters] as const,
  ledger: (organizationId: string | null, filters: InventoryLedgerFilters) =>
    ['inventory', 'ledger', organizationId, filters] as const,
}

export function useInventoryBalancesQuery(filters: InventoryBalanceFilters) {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return useQuery({
    queryKey: inventoryKeys.balances(activeOrganizationId, filters),
    queryFn: async () =>
      unwrapResponse<PaginatedResponse<InventoryBalance>>(api.get('/inventory/balances', { params: filters })),
    enabled: Boolean(activeOrganizationId),
  })
}

export function useInventoryLedgerQuery(filters: InventoryLedgerFilters) {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return useQuery({
    queryKey: inventoryKeys.ledger(activeOrganizationId, filters),
    queryFn: async () =>
      unwrapResponse<PaginatedResponse<InventoryLedgerEntry>>(api.get('/inventory/ledger', { params: filters })),
    enabled: Boolean(activeOrganizationId),
  })
}

export function useCreateAdjustmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: StockAdjustmentPayload) =>
      unwrapResponse<Record<string, unknown>>(api.post('/inventory/adjustments', payload)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
      ])
    },
  })
}
