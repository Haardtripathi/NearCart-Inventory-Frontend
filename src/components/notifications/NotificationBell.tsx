import { useState } from 'react'
import { Bell, Check, PackageSearch, ShoppingCart } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button, Popover, PopoverContent, PopoverTrigger, ScrollArea } from '@/components/ui'
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '@/features/notifications/notifications.api'
import { cn, formatDateTime } from '@/lib/utils'
import type { NotificationLog } from '@/types/inventory'

const MAX_BADGE_COUNT = 9

/**
 * Icon/tone per known `NotificationLogType`. Deliberately a lookup with a fallback rather than an
 * exhaustive switch — the backend enum is expected to grow (auto-assign-failed, driver-arrived,
 * etc. — see NearCart-Inventory backend `NotificationLogType`) and any type this map doesn't know
 * about must still render, just with a generic bell icon, not break or show a blank line.
 */
const NOTIFICATION_ICON_BY_TYPE: Record<string, { icon: LucideIcon; className: string }> = {
  NEW_ORDER: { icon: ShoppingCart, className: 'bg-blue-50 text-blue-600' },
  LOW_STOCK: { icon: PackageSearch, className: 'bg-amber-50 text-amber-600' },
}

function getNotificationVisual(type: string) {
  return NOTIFICATION_ICON_BY_TYPE[type] ?? { icon: Bell, className: 'bg-slate-100 text-slate-500' }
}

/**
 * Best-effort "what should clicking this open" resolver. The backend attaches a `data` JSON blob
 * per notification (see notifications.service.ts / recordNotificationLog call sites) — today it's
 * always `{ salesOrderId }` for NEW_ORDER and `{ variantId, productId, type: 'low_stock' }` for
 * LOW_STOCK, but new types added on the backend may reuse `salesOrderId` (e.g. an auto-assign
 * failure or a driver-arrived event tied to an order) without any frontend change needed here.
 */
function resolveNotificationLink(notification: NotificationLog): string | null {
  const data = notification.data
  if (!data) {
    return null
  }

  const salesOrderId = data.salesOrderId
  if (typeof salesOrderId === 'string' && salesOrderId.length > 0) {
    return `/sales-orders/${salesOrderId}`
  }

  return null
}

function NotificationRow({
  notification,
  onOpen,
}: {
  notification: NotificationLog
  onOpen: (notification: NotificationLog) => void
}) {
  const isUnread = !notification.readAt
  const { icon: Icon, className } = getNotificationVisual(notification.type)

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={cn(
        'flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition hover:bg-slate-50',
        isUnread ? 'bg-primary/5' : 'bg-white',
      )}
    >
      <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', className)}>
        <Icon className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className={cn('truncate text-sm', isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-600')}>
            {notification.title || notification.type}
          </span>
          {isUnread ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" /> : null}
        </span>
        {/* Always render the raw body text, even for a type this UI has no special handling for —
            this is the fallback that guarantees an unrecognized notification type never shows a
            blank line. */}
        <span className="mt-0.5 block text-xs leading-5 text-slate-500">{notification.body}</span>
        <span className="mt-1 block text-[0.68rem] font-medium text-slate-400">{formatDateTime(notification.createdAt)}</span>
      </span>
    </button>
  )
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const notificationsQuery = useNotificationsQuery({ page: 1, limit: 20 })
  const markReadMutation = useMarkNotificationReadMutation()
  const markAllReadMutation = useMarkAllNotificationsReadMutation()

  const notifications = notificationsQuery.data?.items ?? []
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0
  const badgeLabel = unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : String(unreadCount)

  const handleOpenNotification = (notification: NotificationLog) => {
    if (!notification.readAt) {
      markReadMutation.mutate(notification.id)
    }

    const link = resolveNotificationLink(notification)
    if (link) {
      setOpen(false)
      navigate(link)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-full" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[0.62rem] font-bold leading-none text-white">
              {badgeLabel}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-3">
          <p className="text-sm font-semibold text-slate-900">Notifications</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
            onClick={() => markAllReadMutation.mutate()}
          >
            <Check className="h-3.5 w-3.5" />
            Mark all as read
          </Button>
        </div>

        <ScrollArea className="max-h-[360px]">
          <div className="space-y-1 p-2">
            {notificationsQuery.isLoading ? (
              <p className="px-2 py-6 text-center text-sm text-slate-400">Loading notifications…</p>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-2 py-8 text-center">
                <Bell className="h-6 w-6 text-slate-300" />
                <p className="text-sm text-slate-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationRow key={notification.id} notification={notification} onOpen={handleOpenNotification} />
              ))
            )}
          </div>
        </ScrollArea>

        {notifications.length > 0 ? (
          <div className="flex items-center justify-center border-t border-slate-100 py-2">
            <p className="text-[0.68rem] text-slate-400">Showing the most recent {notifications.length} notifications</p>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
