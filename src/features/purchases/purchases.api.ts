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

// Same bounded page-walk approach as sales-orders.api.ts's fetchAllSalesOrdersForExport — see
// that function's doc comment for the full rationale (also used by PurchasesPage.tsx's CSV
// export button).
const EXPORT_PAGE_SIZE = 100
const EXPORT_MAX_PAGES = 50

export async function fetchAllPurchasesForExport(
  filters: Omit<PurchaseFilters, 'page' | 'limit'>,
): Promise<PurchaseReceipt[]> {
  const results: PurchaseReceipt[] = []
  let page = 1

  for (; page <= EXPORT_MAX_PAGES; page += 1) {
    const response = await unwrapResponse<PaginatedResponse<PurchaseReceipt>>(
      api.get('/purchases', { params: { ...filters, page, limit: EXPORT_PAGE_SIZE } }),
    )
    results.push(...response.items)
    if (page >= response.pagination.totalPages) break
  }

  return results
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
