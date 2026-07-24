import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ChevronsUpDown } from 'lucide-react'

import {
  useAssignDriverMutation,
  useCancelSalesOrderMutation,
  useConfirmSalesOrderMutation,
  useDeliverSalesOrderMutation,
  useRejectSalesOrderMutation,
  useSalesOrderQuery,
} from '@/features/sales-orders/sales-orders.api'
import { useOrganizationUsersQuery } from '@/features/users/users.api'
import { CurrencyText, QuantityText } from '@/components/inventory/selectors'
import { DataTable, DetailGrid, DetailItem, EmptyState, ErrorState, InlineNotice, LoadingState, PageHeader, SectionCard, StatusBadge } from '@/components/common'
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui'
import { getSalesOrderStatusLabel } from '@/lib/labels'
import { formatDateTime, parseApiError } from '@/lib/utils'
import type { OrganizationUser } from '@/types/common'

// Orders reaching this stage are relevant to the driver-assignment flow: CONFIRMED is when a
// driver can be assigned, READY/OUT_FOR_DELIVERY/DELIVERED are shown read-only for record-keeping.
const DELIVERY_SECTION_STATUSES = ['CONFIRMED', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED']

function DriverSelect({
  drivers,
  onSelect,
  disabled,
  placeholder,
  emptyLabel,
}: {
  drivers: OrganizationUser[]
  onSelect: (driverId: string) => void
  disabled?: boolean
  placeholder: string
  emptyLabel: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between sm:w-80" disabled={disabled}>
          <span className="truncate text-slate-500">{placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[18rem] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {drivers.map((driver) => (
                <CommandItem
                  key={driver.id}
                  value={`${driver.fullName} ${driver.email}`}
                  onSelect={() => {
                    onSelect(driver.id)
                    setOpen(false)
                  }}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{driver.fullName}</p>
                    <p className="truncate text-xs text-slate-500">{driver.email}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function SalesOrderDetailPage() {
  const { t } = useTranslation(['orders', 'common'])
  const { id } = useParams()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const orderQuery = useSalesOrderQuery(id)
  const confirmMutation = useConfirmSalesOrderMutation()
  const rejectMutation = useRejectSalesOrderMutation()
  const cancelMutation = useCancelSalesOrderMutation()
  const deliverMutation = useDeliverSalesOrderMutation()
  const assignDriverMutation = useAssignDriverMutation()
  const usersQuery = useOrganizationUsersQuery()

  const drivers = useMemo(
    () => (usersQuery.data ?? []).filter((user) => user.role === 'DRIVER' && user.status === 'ACTIVE'),
    [usersQuery.data],
  )

  if (orderQuery.isLoading) {
    return <LoadingState label="Loading sales order..." variant="detail" />
  }

  if (orderQuery.isError) {
    return <ErrorState description="Sales order details could not be loaded right now." onRetry={() => void orderQuery.refetch()} />
  }

  if (!orderQuery.data) {
    return <EmptyState title="Sales order not found" />
  }

  const order = orderQuery.data

  const handleAssignDriver = async (driverId: string) => {
    try {
      await assignDriverMutation.mutateAsync({ id: order.id, driverId })
      toast.success(t('driverAssignedSuccess'))
    } catch (error) {
      toast.error(parseApiError(error).message || t('driverAssignFailed'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Sales order ${order.orderNumber}`}
        description={`Created ${formatDateTime(order.createdAt)} · Branch ${order.branch.name}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {(order.status === 'DRAFT' || order.status === 'PENDING') ? (
              <>
                <Button loading={confirmMutation.isPending} loadingText="Confirming..." onClick={async () => {
                  try {
                    await confirmMutation.mutateAsync(order.id)
                    toast.success('Order confirmed')
                  } catch {
                    toast.error('Could not confirm order')
                  }
                }}>
                  Confirm
                </Button>
                <Button variant="outline" onClick={() => setRejectOpen(true)}>
                  Reject
                </Button>
              </>
            ) : null}
            {order.status !== 'CANCELLED' && order.status !== 'REJECTED' && order.status !== 'DELIVERED' ? (
              <Button variant="outline" loading={cancelMutation.isPending} loadingText="Cancelling..." onClick={async () => {
                try {
                  await cancelMutation.mutateAsync(order.id)
                  toast.success('Order cancelled')
                } catch {
                  toast.error('Could not cancel order')
                }
              }}>
                Cancel
              </Button>
            ) : null}
            {['CONFIRMED', 'READY', 'OUT_FOR_DELIVERY'].includes(order.status) ? (
              <Button loading={deliverMutation.isPending} loadingText="Delivering..." onClick={async () => {
                try {
                  await deliverMutation.mutateAsync(order.id)
                  toast.success('Order delivered')
                } catch {
                  toast.error('Could not deliver order')
                }
              }}>
                Deliver
              </Button>
            ) : null}
          </div>
        }
      />
      <SectionCard title="Order summary" description="Customer, branch, payment, and totals.">
        <DetailGrid>
          <DetailItem label="Status" value={<StatusBadge value={order.status} label={getSalesOrderStatusLabel(t, order.status)} />} />
          <DetailItem label="Payment" value={<StatusBadge value={order.paymentStatus} />} />
          <DetailItem label="Customer" value={order.customer?.name ?? 'Walk-in'} />
          <DetailItem label="Total" value={<CurrencyText value={order.total} />} />
        </DetailGrid>
        {order.notes ? <InlineNotice className="mt-4">{order.notes}</InlineNotice> : null}
      </SectionCard>

      {DELIVERY_SECTION_STATUSES.includes(order.status) ? (
        <SectionCard title={t('deliveryTitle')} description={t('deliveryDescription')}>
          {order.status === 'CONFIRMED' ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">{t('assignDriverDescription')}</p>
              {usersQuery.isLoading ? (
                <p className="text-sm text-slate-500">{t('loadingData', { ns: 'common' })}</p>
              ) : drivers.length ? (
                <DriverSelect
                  drivers={drivers}
                  onSelect={handleAssignDriver}
                  disabled={assignDriverMutation.isPending}
                  placeholder={assignDriverMutation.isPending ? 'Assigning...' : t('selectDriverPlaceholder')}
                  emptyLabel={t('noDriversFound')}
                />
              ) : (
                <InlineNotice tone="warning">{t('noDriversAvailableDescription')}</InlineNotice>
              )}
            </div>
          ) : (
            <DetailGrid className="sm:grid-cols-2 xl:grid-cols-2">
              <DetailItem
                label={t('assignedDriverLabel')}
                value={order.assignedDriver?.fullName ?? t('notAssignedYet')}
                hint={order.assignedDriver?.email}
              />
              <DetailItem label={t('assignedAtLabel')} value={formatDateTime(order.assignedAt)} />
            </DetailGrid>
          )}
        </SectionCard>
      ) : null}

      <SectionCard title="Order items" description="Current order line items from the backend.">
        <DataTable
          columns={[
            { key: 'product', header: 'Product', render: (item) => item.productNameSnapshot ?? item.product?.name ?? '—' },
            { key: 'variant', header: 'Variant', render: (item) => item.variantNameSnapshot ?? item.variant?.name ?? '—' },
            { key: 'sku', header: 'SKU', render: (item) => item.skuSnapshot ?? item.variant?.sku ?? '—' },
            { key: 'quantity', header: 'Quantity', render: (item) => <QuantityText value={item.quantity} /> },
            { key: 'unitPrice', header: 'Unit price', render: (item) => <CurrencyText value={item.unitPrice} /> },
            { key: 'lineTotal', header: 'Line total', render: (item) => <CurrencyText value={item.lineTotal} /> },
          ]}
          items={order.items}
          empty={<EmptyState title="No order items" />}
          rowKey={(item, index) => item.id ?? index}
        />
      </SectionCard>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reject sales order</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this sales order before confirming.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder={t('rejectionReasonPlaceholder')} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                try {
                  await rejectMutation.mutateAsync({ id: order.id, rejectionReason: rejectReason })
                  toast.success('Order rejected')
                  setRejectOpen(false)
                  setRejectReason('')
                } catch {
                  toast.error('Could not reject order')
                }
              }}>
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
