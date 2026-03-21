import { useQuery } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import type { PaginatedResponse } from '@/types/api'
import type { DashboardState, InventoryBalance, InventoryLedgerEntry, SalesOrder } from '@/types/inventory'
import type { Product } from '@/types/product'
import type { Branch } from '@/types/common'

export const dashboardKeys = {
  summary: (organizationId: string | null, language: string) => ['dashboard', organizationId, language] as const,
}

export function useDashboardQuery() {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)
  const language = useUiStore((state) => state.language)

  return useQuery({
    queryKey: dashboardKeys.summary(activeOrganizationId, language),
    queryFn: async (): Promise<DashboardState> => {
      const [
        totalProducts,
        activeProducts,
        lowStockItems,
        pendingSalesOrders,
        totalBranches,
        recentMovements,
        recentOrders,
        importedCandidates,
      ] = await Promise.all([
        unwrapResponse<PaginatedResponse<Product>>(api.get('/products', { params: { page: 1, limit: 1 } })),
        unwrapResponse<PaginatedResponse<Product>>(api.get('/products', { params: { page: 1, limit: 1, status: 'ACTIVE' } })),
        unwrapResponse<PaginatedResponse<InventoryBalance>>(api.get('/inventory/balances', { params: { page: 1, limit: 5, lowStock: true } })),
        unwrapResponse<PaginatedResponse<SalesOrder>>(api.get('/sales-orders', { params: { page: 1, limit: 1, status: 'PENDING' } })),
        unwrapResponse<PaginatedResponse<Branch>>(api.get('/branches', { params: { page: 1, limit: 1 } })),
        unwrapResponse<PaginatedResponse<InventoryLedgerEntry>>(api.get('/inventory/ledger', { params: { page: 1, limit: 6 } })),
        unwrapResponse<PaginatedResponse<SalesOrder>>(api.get('/sales-orders', { params: { page: 1, limit: 6 } })),
        unwrapResponse<PaginatedResponse<Product>>(api.get('/products', { params: { page: 1, limit: 50 } })),
      ])

      return {
        totalProducts: totalProducts.pagination.totalItems,
        activeProducts: activeProducts.pagination.totalItems,
        lowStockItems: lowStockItems.items,
        pendingSalesOrders: pendingSalesOrders.pagination.totalItems,
        totalBranches: totalBranches.pagination.totalItems,
        recentMovements: recentMovements.items,
        recentOrders: recentOrders.items,
        importedMasterProducts: importedCandidates.items.filter((item) => item.sourceType === 'MASTER_TEMPLATE'),
      }
    },
    enabled: Boolean(activeOrganizationId),
    staleTime: 30_000,
  })
}
