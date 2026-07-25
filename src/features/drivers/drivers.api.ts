import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import type { Driver, DriverStatus, DriverSummary, ListState } from '@/types/common'

/**
 * Platform-wide gig-driver pool (Swiggy/Zomato-style) — see PHASE1_REQUIREMENTS.md
 * "Driver API contract" (locked 2026-07-24). Two consumers of this module:
 *
 *  - Org-staff assignment (`useVerifiedDriversQuery`): any shop's MANAGER_ROLES staff can see
 *    the shared VERIFIED pool to assign a driver to a READY sales order.
 *  - Platform-admin verification (`usePlatformDriversQuery` + verify/suspend mutations):
 *    Inventory SUPER_ADMIN only.
 *
 * Response shapes cross-checked directly against the real backend implementation
 * (platform.service.ts): `GET /drivers` (org-staff dropdown) returns a plain array — no
 * pagination, it's a `findMany` with no skip/take. `GET /platform/drivers` (platform-admin list)
 * DOES paginate (`{ items, pagination }`, same shape as every other real paginated list endpoint
 * in this codebase) — it was previously mistyped here as a plain array, which would have thrown
 * at render time the first time a SUPER_ADMIN opened this page (`items.map is not a function`
 * inside DataTable). Requests `limit: MAX_PAGE_SIZE` since DriversPage has no pagination UI yet.
 */
const MAX_PAGE_SIZE = 100

export const driversKeys = {
  verified: ['drivers', 'verified'] as const,
  platformList: (status?: DriverStatus | '') => ['platform', 'drivers', status || 'ALL'] as const,
}

// GET /api/drivers?status=VERIFIED — minimal fields (id, fullName, phone, vehicleType) for the
// sales-order "Assign driver" dropdown. Any shop can see/assign any verified driver (shared pool).
// `enabled` defaults to true but callers that only need this for a READY, unassigned order (e.g.
// SalesOrderDetailPage) should pass a scoped condition — otherwise every order-detail page view
// (including DRAFT/CONFIRMED/DELIVERED orders that will never show the assign-driver UI) fires an
// unnecessary request.
export function useVerifiedDriversQuery(enabled = true) {
  return useQuery({
    queryKey: driversKeys.verified,
    queryFn: async () =>
      unwrapResponse<DriverSummary[]>(api.get('/drivers', { params: { status: 'VERIFIED' } })),
    staleTime: 30_000,
    enabled,
  })
}

// GET /api/platform/drivers?status=PENDING_VERIFICATION|VERIFIED|SUSPENDED — SUPER_ADMIN only.
export function usePlatformDriversQuery(status?: DriverStatus | '') {
  return useQuery({
    queryKey: driversKeys.platformList(status),
    queryFn: async () =>
      unwrapResponse<ListState<Driver>>(
        api.get('/platform/drivers', { params: { limit: MAX_PAGE_SIZE, ...(status ? { status } : undefined) } }),
      ),
    select: (data) => data.items,
  })
}

// PATCH /api/platform/drivers/:id/verify — PENDING_VERIFICATION or SUSPENDED -> VERIFIED.
export function useVerifyDriverMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => unwrapResponse<Driver>(api.patch(`/platform/drivers/${id}/verify`)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['platform', 'drivers'] }),
        queryClient.invalidateQueries({ queryKey: driversKeys.verified }),
      ])
    },
  })
}

// PATCH /api/platform/drivers/:id/suspend — VERIFIED -> SUSPENDED.
export function useSuspendDriverMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => unwrapResponse<Driver>(api.patch(`/platform/drivers/${id}/suspend`)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['platform', 'drivers'] }),
        queryClient.invalidateQueries({ queryKey: driversKeys.verified }),
      ])
    },
  })
}
