import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useInventoryBalancesQuery, useInventoryLedgerQuery } from '@/features/inventory/inventory.api'
import { useProductQuery } from '@/features/products/products.api'
import { CurrencyText, QuantityText } from '@/components/inventory/selectors'
import { DataTable, DetailGrid, DetailItem, EmptyState, InlineNotice, LoadingState, PageHeader, SectionCard, StatusBadge } from '@/components/common'
import { Button } from '@/components/ui'
import { formatDateTime, getDisplayName } from '@/lib/utils'
import { LANGUAGE_CODES } from '@/types/common'

export function ProductDetailPage() {
  const { id } = useParams()
  const productQuery = useProductQuery(id)
  const balancesQuery = useInventoryBalancesQuery({ page: 1, limit: 100, productId: id })
  const ledgerQuery = useInventoryLedgerQuery({ page: 1, limit: 50, productId: id })

  const ledgerItems = useMemo(() => (ledgerQuery.data?.items ?? []).slice(0, 8), [ledgerQuery.data?.items])

  if (productQuery.isLoading) {
    return <LoadingState label="Loading product..." />
  }

  if (!productQuery.data) {
    return <EmptyState title="Product not found" />
  }

  const product = productQuery.data
  const visibleTranslations = (product.translations ?? []).filter((translation) =>
    LANGUAGE_CODES.includes(translation.language as (typeof LANGUAGE_CODES)[number]),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={getDisplayName(product)}
        description={product.displayDescription ?? product.description ?? 'No description provided.'}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to={`/products/${product.id}/edit`}>Edit product</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`/inventory/adjustments/new?productId=${product.id}&variantId=${product.variants[0]?.id ?? ''}`}>Adjust stock</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/purchases/new">Create purchase</Link>
            </Button>
            <Button asChild>
              <Link to="/sales-orders/new">Create sales order</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Product summary" description="Core classification, source, and inventory behavior.">
          <DetailGrid className="xl:grid-cols-3">
            <DetailItem label="Source type" value={<StatusBadge value={product.sourceType} />} />
            <DetailItem label="Status" value={<StatusBadge value={product.status} />} />
            <DetailItem label="Category" value={product.category ? getDisplayName(product.category) : '—'} />
            <DetailItem label="Brand" value={product.brand?.name ?? '—'} />
            <DetailItem label="Product type" value={product.productType} />
            <DetailItem label="Track method" value={product.trackMethod} />
          </DetailGrid>
          {product.masterCatalogItem ? (
            <InlineNotice className="mt-4" tone="success">
              Imported from master item <Link className="font-semibold underline" to={`/master-catalog/items/${product.masterCatalogItem.id}`}>{product.masterCatalogItem.canonicalName}</Link>
            </InlineNotice>
          ) : null}
        </SectionCard>

        <SectionCard title="Translations" description="Backend-provided localized records.">
          <div className="space-y-3">
            {visibleTranslations.map((translation) => (
              <div key={translation.language} className="rounded-md border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{translation.language}</p>
                <p className="mt-2 font-medium text-slate-900">{translation.name}</p>
                {translation.description ? <p className="mt-1 text-sm text-slate-600">{translation.description}</p> : null}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Variants" description="Sellable or stock-tracked product variants.">
        <DataTable
          columns={[
            { key: 'name', header: 'Variant', render: (variant) => <div><p className="font-medium text-slate-900">{getDisplayName(variant)}</p><p className="text-xs text-slate-500">{variant.sku}</p></div> },
            { key: 'prices', header: 'Prices', render: (variant) => <div className="text-sm text-slate-600">Sell: <CurrencyText value={variant.sellingPrice} /> · Cost: <CurrencyText value={variant.costPrice} /></div> },
            { key: 'levels', header: 'Levels', render: (variant) => <div className="text-sm text-slate-600">Reorder <QuantityText value={variant.reorderLevel} /></div> },
            { key: 'status', header: 'Status', render: (variant) => <StatusBadge value={variant.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
            { key: 'actions', header: 'Actions', render: (variant) => <Button asChild size="sm" variant="ghost"><Link to={`/products/${product.id}/variants/${variant.id}/edit`}>Edit variant</Link></Button> },
          ]}
          items={product.variants}
          empty={<EmptyState title="No variants found" />}
          rowKey={(variant) => variant.id}
        />
      </SectionCard>

      <SectionCard title="Current inventory by branch" description="Branch-level stock balances for this product.">
        <DataTable
          columns={[
            { key: 'branch', header: 'Branch', render: (row) => row.branch.name },
            { key: 'variant', header: 'Variant', render: (row) => getDisplayName(row.variant) },
            { key: 'onHand', header: 'On hand', render: (row) => <QuantityText value={row.onHand} /> },
            { key: 'reserved', header: 'Reserved', render: (row) => <QuantityText value={row.reserved} /> },
            { key: 'available', header: 'Available', render: (row) => <QuantityText value={row.available} /> },
          ]}
          items={balancesQuery.data?.items ?? []}
          empty={<EmptyState title="No branch balances yet" description="Stock balances will appear after operational activity." />}
          rowKey={(row) => row.id}
        />
      </SectionCard>

      <SectionCard title="Recent ledger entries" description="Most recent ledger rows for this product's variants.">
        <DataTable
          columns={[
            { key: 'date', header: 'Date', render: (entry) => formatDateTime(entry.createdAt) },
            { key: 'variant', header: 'Variant', render: (entry) => getDisplayName(entry.variant) },
            { key: 'branch', header: 'Branch', render: (entry) => entry.branch.name },
            { key: 'movement', header: 'Movement', render: (entry) => <StatusBadge value={entry.movementType} /> },
            { key: 'delta', header: 'Delta', render: (entry) => <QuantityText value={entry.quantityDelta} /> },
            { key: 'reference', header: 'Reference', render: (entry) => entry.referenceType },
          ]}
          items={ledgerItems}
          empty={<EmptyState title="No recent ledger entries" description="Stock entries for this product will show here once variants are used in operations." />}
          rowKey={(entry) => entry.id}
        />
      </SectionCard>
    </div>
  )
}
