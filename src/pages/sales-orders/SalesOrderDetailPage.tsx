import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'

import {
  useAssignSalesOrderDriverMutation,
  useCancelSalesOrderMutation,
  useConfirmSalesOrderMutation,
  useDeliverSalesOrderMutation,
  useMarkSalesOrderReadyMutation,
  useRejectSalesOrderMutation,
  useSalesOrderQuery,
} from '@/features/sales-orders/sales-orders.api'
import { useVerifiedDriversQuery } from '@/features/drivers/drivers.api'
import { CurrencyText, QuantityText } from '@/components/inventory/selectors'
import { DataTable, DetailGrid, DetailItem, EmptyState, ErrorState, InlineNotice, LoadingState, PageHeader, SectionCard, StatusBadge } from '@/components/common'
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, OptionSelect } from '@/components/ui'
import { formatDateTime, parseApiError } from '@/lib/utils'

export function SalesOrderDetailPage() {
  const { t } = useTranslation('orders')
  const { id } = useParams()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const orderQuery = useSalesOrderQuery(id)
  const confirmMutation = useConfirmSalesOrderMutation()
  const rejectMutation = useRejectSalesOrderMutation()
  const cancelMutation = useCancelSalesOrderMutation()
  const deliverMutation = useDeliverSalesOrderMutation()
  const markReadyMutation = useMarkSalesOrderReadyMutation()
  const assignDriverMutation = useAssignSalesOrderDriverMutation()
  // Only needed once the order is READY and doesn't already have a driver — avoid firing this on
  // every order-detail view (DRAFT/CONFIRMED/DELIVERED orders never render the assign-driver UI).
  const verifiedDriversQuery = useVerifiedDriversQuery(
    orderQuery.data?.status === 'READY' && !orderQuery.data.assignedDriver,
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
                  } catch (error) {
                    // Confirm commonly fails for a specific, actionable reason (e.g. insufficient
                    // stock) - surface the backend's real message instead of a generic one that
                    // leaves staff with no idea what to fix (see parseApiError usage pattern
                    // already established elsewhere in this app, e.g. LoginPage/ProductFormPage).
                    toast.error(parseApiError(error).message || 'Could not confirm order')
                  }
                }}>
                  Confirm
                </Button>
                <Button variant="outline" onClick={() => setRejectOpen(true)}>
                  Reject
                </Button>
              </>
            ) : null}
            {order.status === 'CONFIRMED' ? (
              <Button loading={markReadyMutation.isPending} loadingText="Marking ready..." onClick={async () => {
                try {
                  await markReadyMutation.mutateAsync(order.id)
                  toast.success('Order marked ready')
                } catch (error) {
                  toast.error(parseApiError(error).message || 'Could not mark order ready')
                }
              }}>
                Mark ready
              </Button>
            ) : null}
            {order.status !== 'CANCELLED' && order.status !== 'REJECTED' && order.status !== 'DELIVERED' && order.status !== 'RETURNED' ? (
              <Button variant="outline" loading={cancelMutation.isPending} loadingText="Cancelling..." onClick={async () => {
                try {
                  await cancelMutation.mutateAsync(order.id)
                  toast.success('Order cancelled')
                } catch (error) {
                  toast.error(parseApiError(error).message || 'Could not cancel order')
                }
              }}>
                Cancel
              </Button>
            ) : null}
            {order.status === 'OUT_FOR_DELIVERY' ? (
              <Button loading={deliverMutation.isPending} loadingText="Delivering..." onClick={async () => {
                try {
                  await deliverMutation.mutateAsync(order.id)
                  toast.success('Order delivered')
                } catch (error) {
                  toast.error(parseApiError(error).message || 'Could not deliver order')
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
          <DetailItem label="Status" value={<StatusBadge value={order.status} />} />
          <DetailItem label="Payment" value={<StatusBadge value={order.paymentStatus} />} />
          <DetailItem label="Customer" value={order.customer?.name ?? 'Walk-in'} />
          <DetailItem label="Total" value={<CurrencyText value={order.total} />} />
        </DetailGrid>
        {order.notes ? <InlineNotice className="mt-4">{order.notes}</InlineNotice> : null}
      </SectionCard>
      {(['READY', 'OUT_FOR_DELIVERY', 'DELIVERED'] as string[]).includes(order.status) ? (
        <SectionCard
          title="Delivery"
          description="Driver assignment and fulfillment handoff for this order."
        >
          {order.assignedDriver ? (
            <DetailGrid>
              <DetailItem label="Driver" value={order.assignedDriver.fullName} />
              <DetailItem label="Phone" value={order.assignedDriver.phone} />
              <DetailItem label="Vehicle" value={order.assignedDriver.vehicleType} />
            </DetailGrid>
          ) : order.status === 'READY' ? (
            verifiedDriversQuery.isError ? (
              <InlineNotice tone="warning">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>Verified drivers could not be loaded right now.</span>
                  <Button size="sm" variant="outline" onClick={() => void verifiedDriversQuery.refetch()}>
                    Retry
                  </Button>
                </div>
              </InlineNotice>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="w-full sm:max-w-sm">
                  <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Assign driver
                  </p>
                  <OptionSelect
                    value={selectedDriverId}
                    onValueChange={setSelectedDriverId}
                    placeholder={verifiedDriversQuery.isLoading ? 'Loading drivers...' : 'Select a verified driver'}
                    options={(verifiedDriversQuery.data ?? []).map((driver) => ({
                      value: driver.id,
                      label: `${driver.fullName} · ${driver.phone} · ${driver.vehicleType}`,
                    }))}
                    disabled={verifiedDriversQuery.isLoading}
                  />
                </div>
                <Button
                  disabled={!selectedDriverId}
                  loading={assignDriverMutation.isPending}
                  loadingText="Assigning..."
                  onClick={async () => {
                    try {
                      await assignDriverMutation.mutateAsync({ id: order.id, driverId: selectedDriverId })
                      toast.success('Driver assigned')
                      setSelectedDriverId('')
                    } catch (error) {
                      toast.error(parseApiError(error).message || 'Could not assign driver')
                    }
                  }}
                >
                  Assign driver
                </Button>
              </div>
            )
          ) : (
            <InlineNotice>No driver has been assigned to this order.</InlineNotice>
          )}
          {!order.assignedDriver &&
          order.status === 'READY' &&
          !verifiedDriversQuery.isLoading &&
          !verifiedDriversQuery.isError &&
          (verifiedDriversQuery.data ?? []).length === 0 ? (
            <InlineNotice className="mt-4" tone="warning">
              No verified drivers are available yet. Verify a driver from the Drivers page before assigning.
            </InlineNotice>
          ) : null}
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
              <Button
                disabled={!rejectReason.trim()}
                loading={rejectMutation.isPending}
                loadingText="Rejecting..."
                onClick={async () => {
                  try {
                    await rejectMutation.mutateAsync({ id: order.id, rejectionReason: rejectReason })
                    toast.success('Order rejected')
                    setRejectOpen(false)
                    setRejectReason('')
                  } catch (error) {
                    toast.error(parseApiError(error).message || 'Could not reject order')
                  }
                }}
              >
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
