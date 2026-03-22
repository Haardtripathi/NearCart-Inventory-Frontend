import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useInventoryBalancesQuery } from '@/features/inventory/inventory.api'
import { useDebounce } from '@/hooks/useDebounce'
import { useOrgStore } from '@/store/org.store'
import { BranchSelector, ProductSelector, QuantityText, VariantSelector } from '@/components/inventory/selectors'
import { DataTable, EmptyState, FilterBar, LoadingState, PageHeader, PaginationControls, SearchInput, StatusBadge } from '@/components/common'
import { CheckboxField } from '@/components/forms'
import { Button } from '@/components/ui'
import { getDisplayName } from '@/lib/utils'

export function InventoryBalancesPage() {
  const { t } = useTranslation(['common', 'inventory'])
  const defaultBranchId = useOrgStore((state) => state.activeBranchId)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [branchId, setBranchId] = useState(defaultBranchId ?? '')
  const [productId, setProductId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const debouncedSearch = useDebounce(search)

  const balancesQuery = useInventoryBalancesQuery({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    branchId: branchId || undefined,
    productId: productId || undefined,
    variantId: variantId || undefined,
    lowStock: lowStockOnly || undefined,
  })

  const items = useMemo(() => balancesQuery.data?.items ?? [], [balancesQuery.data?.items])

  if (balancesQuery.isLoading) {
    return <LoadingState label="Loading inventory balances..." variant="list" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory balances"
        description="Track on-hand, reserved, and available stock across branches."
      />
      <FilterBar className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <SearchInput value={search} onChange={(event) => {
          setPage(1)
          setSearch(event.target.value)
        }} placeholder={t('searchProductOrSkuPlaceholder', { ns: 'common' })} />
        <BranchSelector includeAll value={branchId} onChange={(value) => {
          setPage(1)
          setBranchId(value)
        }} />
        <ProductSelector includeAll value={productId} onChange={(value) => {
          setPage(1)
          setProductId(value)
          setVariantId('')
        }} />
        <VariantSelector includeAll productId={productId || undefined} value={variantId} onChange={(value) => {
          setPage(1)
          setVariantId(value)
        }} />
        <CheckboxField
          checked={lowStockOnly}
          className="h-full"
          label={t('lowStockOnly', { ns: 'inventory' })}
          description={t('lowStockOnlyDescription', { ns: 'inventory' })}
          onCheckedChange={(checked) => {
            setPage(1)
            setLowStockOnly(checked)
          }}
        />
      </FilterBar>
      <DataTable
        columns={[
          { key: 'product', header: 'Product', render: (row) => <div><p className="font-medium text-slate-900">{getDisplayName(row.product)}</p><p className="text-xs text-slate-500">{getDisplayName(row.variant)}</p></div> },
          { key: 'branch', header: 'Branch', render: (row) => row.branch.name },
          { key: 'onHand', header: 'On hand', render: (row) => <QuantityText value={row.onHand} /> },
          { key: 'reserved', header: 'Reserved', render: (row) => <QuantityText value={row.reserved} /> },
          { key: 'available', header: 'Available', render: (row) => <QuantityText value={row.available} /> },
          {
            key: 'levels',
            header: 'Levels',
            render: (row) => (
              <div className="text-sm text-slate-600">
                Reorder: <QuantityText value={row.variant.reorderLevel} /> · Min: <QuantityText value={row.variant.minStockLevel} />
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) =>
              Number(row.onHand) <= Number(row.variant.reorderLevel || row.variant.minStockLevel)
                ? <StatusBadge value="LOW_STOCK" />
                : <StatusBadge value="HEALTHY" />,
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (row) => (
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link to={`/inventory/adjustments/new?branchId=${row.branchId}&productId=${row.productId}&variantId=${row.variantId}`}>Adjust</Link>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link to={`/inventory/ledger?variantId=${row.variantId}&branchId=${row.branchId}`}>Ledger</Link>
                </Button>
              </div>
            ),
          },
        ]}
        items={items}
        rowClassName={(row) => Number(row.onHand) <= Number(row.variant.reorderLevel || row.variant.minStockLevel) ? 'bg-amber-50/60' : undefined}
        empty={<EmptyState title="No inventory balances found" description="Balances appear after purchases, adjustments, sales, or transfers." />}
        rowKey={(row) => row.id}
      />
      <PaginationControls pagination={balancesQuery.data?.pagination} onPageChange={setPage} />
    </div>
  )
}
