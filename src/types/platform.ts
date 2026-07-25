// Types for the SUPER_ADMIN-only cross-organization monitoring dashboard.
//
// `PlatformOrganizationOverview` is the contract for a new backend endpoint
// (`GET /platform/organizations`, SUPER_ADMIN only) that does not exist yet as of this build — see
// features/platform/platform.api.ts for the request shape and pages/platform/PlatformOrganizationsPage.tsx
// for how it's consumed. Documented here so a backend follow-up has a clear shape to implement against.
export interface PlatformOrganizationOverview {
  id: string
  name: string
  slug: string
  status: string
  createdAt: string
  branchCount: number
  memberCount: number
  salesOrderCount: number
  lastSalesOrderAt: string | null
}
