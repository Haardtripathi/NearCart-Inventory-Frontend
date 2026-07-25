import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import type { Driver, DriverStatus, DriverSummary } from '@/types/common'

/**
 * Platform-wide gig-driver pool (Swiggy/Zomato-style) — see PHASE1_REQUIREMENTS.md
 * "Driver API contract" (locked 2026-07-24). Two consumers of this module:
 *
 *  - Org-staff assignment (`useVerifiedDriversQuery`): any shop's MANAGER_ROLES staff can see
 *    the shared VERIFIED pool to assign a driver to a READY sales order.
 *  - Platform-admin verification (`usePlatformDriversQuery` + verify/suspend mutations):
 *    Inventory SUPER_ADMIN only.
 *
 * Response shapes for the list endpoints aren't fully pinned down in the contract doc (it
 * documents the field sets, not whether they're paginated). Following the same convention as
 * other platform/admin list endpoints in this codebase (e.g. `/platform/industries`,
 * `/users` directory) that return a plain array rather than a `{ items, pagination }` envelope —
 * flagged in the implementation report so the backend agent's actual shape can be reconciled if
 * it differs.
 */

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
      unwrapResponse<Driver[]>(api.get('/platform/drivers', { params: status ? { status } : undefined })),
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
