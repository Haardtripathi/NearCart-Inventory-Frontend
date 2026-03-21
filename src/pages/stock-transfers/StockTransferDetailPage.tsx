import { useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'

import { useApproveStockTransferMutation, useCancelStockTransferMutation, useStockTransferQuery } from '@/features/stock-transfers/stock-transfers.api'
import { CurrencyText, QuantityText } from '@/components/inventory/selectors'
import { DataTable, DetailGrid, DetailItem, EmptyState, InlineNotice, LoadingState, PageHeader, SectionCard, StatusBadge } from '@/components/common'
import { Button } from '@/components/ui'
import { formatDateTime } from '@/lib/utils'

export function StockTransferDetailPage() {
  const { id } = useParams()
  const transferQuery = useStockTransferQuery(id)
  const approveMutation = useApproveStockTransferMutation()
  const cancelMutation = useCancelStockTransferMutation()

  if (transferQuery.isLoading) {
    return <LoadingState label="Loading stock transfer..." />
  }

  if (!transferQuery.data) {
    return <EmptyState title="Stock transfer not found" />
  }

  const transfer = transferQuery.data

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Transfer ${transfer.transferNumber}`}
        description={`Created ${formatDateTime(transfer.createdAt)} · ${transfer.fromBranch.name} → ${transfer.toBranch.name}`}
        actions={
          transfer.status === 'DRAFT' ? (
            <div className="flex gap-2">
              <Button disabled={approveMutation.isPending} onClick={async () => {
                try {
                  await approveMutation.mutateAsync(transfer.id)
                  toast.success('Transfer approved')
                } catch {
                  toast.error('Could not approve transfer')
                }
              }}>
                Approve
              </Button>
              <Button variant="outline" disabled={cancelMutation.isPending} onClick={async () => {
                try {
                  await cancelMutation.mutateAsync(transfer.id)
                  toast.success('Transfer cancelled')
                } catch {
                  toast.error('Could not cancel transfer')
                }
              }}>
                Cancel
              </Button>
            </div>
          ) : null
        }
      />
      <SectionCard title="Transfer summary" description="Branch movement direction and current status.">
        <DetailGrid className="xl:grid-cols-3">
          <DetailItem label="From branch" value={transfer.fromBranch.name} />
          <DetailItem label="To branch" value={transfer.toBranch.name} />
          <DetailItem label="Status" value={<StatusBadge value={transfer.status} />} />
        </DetailGrid>
        {transfer.notes ? <InlineNotice className="mt-4">{transfer.notes}</InlineNotice> : null}
      </SectionCard>
      <SectionCard title="Items" description="Each line will move stock out of one branch and into another on approval.">
        <DataTable
          columns={[
            { key: 'product', header: 'Product', render: (item) => item.product?.displayName ?? item.product?.name ?? '—' },
            { key: 'variant', header: 'Variant', render: (item) => item.variant?.displayName ?? item.variant?.name ?? '—' },
            { key: 'quantity', header: 'Quantity', render: (item) => <QuantityText value={item.quantity} /> },
            { key: 'unitCost', header: 'Unit cost', render: (item) => <CurrencyText value={item.unitCost} /> },
          ]}
          items={transfer.items}
          empty={<EmptyState title="No transfer items" />}
          rowKey={(item, index) => item.id ?? index}
        />
      </SectionCard>
    </div>
  )
}
