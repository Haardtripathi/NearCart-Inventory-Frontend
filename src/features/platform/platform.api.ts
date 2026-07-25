import { useQuery } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import type { PlatformOrganizationOverview } from '@/types/platform'

export const platformKeys = {
  organizationsOverview: ['platform', 'organizations-overview'] as const,
}

// Contract for a new backend endpoint (SUPER_ADMIN only): `GET /platform/organizations`.
// Response: PlatformOrganizationOverview[] — one row per organization with cheap-to-compute
// activity signals (branch/member/sales-order counts, last sales-order timestamp). This mirrors
// the existing `/platform/industries` convention (see features/meta/meta.api.ts) rather than
// overloading `/organizations/my`, which is already used for the org-switcher and org-setup flows
// and returns per-membership data, not platform-wide aggregates.
//
// This endpoint does not exist in the backend as of this build (verified by reading
// backend/src/modules/platform/platform.route.ts and organizations.route.ts) — the page built
// against this hook will show its normal ErrorState until a backend follow-up implements it.
export function usePlatformOrganizationsOverviewQuery(enabled = true) {
  return useQuery({
    queryKey: platformKeys.organizationsOverview,
    queryFn: async () =>
      unwrapResponse<PlatformOrganizationOverview[]>(api.get('/platform/organizations')),
    enabled,
    staleTime: 30_000,
  })
}
