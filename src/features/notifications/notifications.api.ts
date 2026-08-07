import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import type { PaginatedResponse } from '@/types/api'
import type { NotificationLog } from '@/types/inventory'

export interface NotificationFilters {
  page?: number
  limit?: number
  unreadOnly?: boolean
}

export interface NotificationListResponse extends PaginatedResponse<NotificationLog> {
  unreadCount: number
}

export const notificationsKeys = {
  list: (organizationId: string | null, filters: NotificationFilters) =>
    ['notifications', organizationId, filters] as const,
}

// Polled from the bell in AppShell so the unread badge updates without a manual refresh — there's
// no websocket/SSE for this backend (see NearCart-Inventory/CLAUDE.md "Notifications / real-time"),
// so this is the whole real-time story for the shop-owner-facing side. 25s keeps it well clear of
// the "avoid sub-10s polling" guidance while still feeling reasonably live.
const NOTIFICATIONS_POLL_INTERVAL_MS = 25_000

export function useNotificationsQuery(filters: NotificationFilters = {}) {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return useQuery({
    queryKey: notificationsKeys.list(activeOrganizationId, filters),
    queryFn: async () =>
      unwrapResponse<NotificationListResponse>(api.get('/notifications', { params: filters })),
    enabled: Boolean(activeOrganizationId),
    refetchInterval: NOTIFICATIONS_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  })
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) =>
      unwrapResponse<NotificationLog>(api.patch(`/notifications/${id}/read`)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () =>
      unwrapResponse<{ updatedCount: number }>(api.patch('/notifications/read-all')),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
