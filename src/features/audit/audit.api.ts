import { useQuery } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import type { PaginatedResponse } from '@/types/api'
import type { AuditAction } from '@/types/common'

export interface AuditLog {
  id: string
  action: AuditAction
  entityType: string
  entityId?: string | null
  meta?: unknown
  createdAt: string
  actorUser?: {
    id: string
    fullName: string
    email: string
  } | null
}

export interface AuditFilters {
  page?: number
  limit?: number
  search?: string
  action?: AuditAction
  entityType?: string
  actor?: string
  startDate?: string
  endDate?: string
}

export const auditKeys = {
  list: (organizationId: string | null, filters: AuditFilters) => ['audit-logs', organizationId, filters] as const,
}

export function useAuditLogsQuery(filters: AuditFilters) {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return useQuery({
    queryKey: auditKeys.list(activeOrganizationId, filters),
    queryFn: async () => unwrapResponse<PaginatedResponse<AuditLog>>(api.get('/audit-logs', { params: filters })),
    enabled: Boolean(activeOrganizationId),
  })
}
