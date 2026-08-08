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
        // `.items` is capped at the `limit: 5` request above (just enough for the preview list) —
        // confirmed live 2026-08-08: with 6 real low-stock balances in the org, `.items.length`
        // read 5 while `.pagination.totalItems` correctly read 6. The metric card must use the
        // latter, not `lowStockItems.length`, or it silently under-reports past 5.
        lowStockItems: lowStockItems.items,
        lowStockItemsTotal: lowStockItems.pagination.totalItems,
        pendingSalesOrders: pendingSalesOrders.pagination.totalItems,
        totalBranches: totalBranches.pagination.totalItems,
        recentMovements: recentMovements.items,
        recentOrders: recentOrders.items,
        importedMasterProducts: importedCandidates.items.filter((item) => item.sourceType === 'MASTER_TEMPLATE'),
      }
    },
    enabled: Boolean(activeOrganizationId),
    staleTime: 30_000,
    // Surfaces pendingSalesOrders / recentOrders, both order-relevant per the global
    // refetchOnWindowFocus:false default audit (lib/queryClient.ts). This is an 8-endpoint
    // fan-out per fetch, so a tab-focus refetch (not a fixed interval) is the appropriate fix
    // here rather than continuous polling, which would multiply into a lot of backend load.
    refetchOnWindowFocus: true,
  })
}
