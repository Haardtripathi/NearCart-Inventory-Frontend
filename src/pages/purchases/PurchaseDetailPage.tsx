import { useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'

import { usePostPurchaseMutation, usePurchaseQuery } from '@/features/purchases/purchases.api'
import { CurrencyText, QuantityText } from '@/components/inventory/selectors'
import { DataTable, DetailGrid, DetailItem, EmptyState, InlineNotice, LoadingState, PageHeader, SectionCard, StatusBadge } from '@/components/common'
import { Button } from '@/components/ui'
import { formatDateTime } from '@/lib/utils'

export function PurchaseDetailPage() {
  const { id } = useParams()
  const purchaseQuery = usePurchaseQuery(id)
  const postPurchaseMutation = usePostPurchaseMutation()

  if (purchaseQuery.isLoading) {
    return <LoadingState label="Loading purchase..." />
  }

  if (!purchaseQuery.data) {
    return <EmptyState title="Purchase not found" />
  }

  const purchase = purchaseQuery.data

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Purchase ${purchase.receiptNumber}`}
        description={`Created ${formatDateTime(purchase.createdAt)} · Branch ${purchase.branch.name}`}
        actions={
          purchase.status === 'DRAFT' ? (
            <Button
              loading={postPurchaseMutation.isPending}
              loadingText="Posting purchase..."
              onClick={async () => {
                try {
                  await postPurchaseMutation.mutateAsync(purchase.id)
                  toast.success('Purchase posted')
                } catch {
                  toast.error('Could not post purchase')
                }
              }}
            >
              Post purchase
            </Button>
          ) : null
        }
      />
      <SectionCard title="Receipt summary" description="Status, supplier, totals, and notes.">
        <DetailGrid>
          <DetailItem label="Status" value={<StatusBadge value={purchase.status} />} />
          <DetailItem label="Supplier" value={purchase.supplier?.name ?? '—'} />
          <DetailItem label="Invoice date" value={purchase.invoiceDate ? formatDateTime(purchase.invoiceDate) : '—'} />
          <DetailItem label="Total" value={<CurrencyText value={purchase.total} />} />
        </DetailGrid>
        {purchase.notes ? <InlineNotice className="mt-4">{purchase.notes}</InlineNotice> : null}
      </SectionCard>
      <SectionCard title="Items" description="All receipt lines that will affect inventory when posted.">
        <DataTable
          columns={[
            { key: 'product', header: 'Product', render: (item) => item.product?.displayName ?? item.product?.name ?? '—' },
            { key: 'variant', header: 'Variant', render: (item) => item.variant?.displayName ?? item.variant?.name ?? '—' },
            { key: 'quantity', header: 'Quantity', render: (item) => <QuantityText value={item.quantity} /> },
            { key: 'unitCost', header: 'Unit cost', render: (item) => <CurrencyText value={item.unitCost} /> },
            { key: 'tax', header: 'Tax', render: (item) => <CurrencyText value={item.taxAmount} /> },
            { key: 'lineTotal', header: 'Line total', render: (item) => <CurrencyText value={item.lineTotal} /> },
          ]}
          items={purchase.items}
          empty={<EmptyState title="No line items" />}
          rowKey={(item, index) => item.id ?? index}
        />
      </SectionCard>
    </div>
  )
}
