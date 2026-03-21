import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useInventoryLedgerQuery } from '@/features/inventory/inventory.api'
import { useDebounce } from '@/hooks/useDebounce'
import { useOrgStore } from '@/store/org.store'
import { BranchSelector, ProductSelector, QuantityText, VariantSelector } from '@/components/inventory/selectors'
import { DataTable, EmptyState, FilterBar, LoadingState, PageHeader, PaginationControls, SearchInput, StatusBadge } from '@/components/common'
import { DatePicker, OptionSelect } from '@/components/ui'
import { STOCK_MOVEMENT_TYPES, type StockMovementType } from '@/types/common'
import { formatDateForInput, formatDateTime, getDisplayName, parseDateValue } from '@/lib/utils'
import { getStockMovementTypeLabel } from '@/lib/labels'

export function InventoryLedgerPage() {
  const { t } = useTranslation('common')
  const defaultBranchId = useOrgStore((state) => state.activeBranchId)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [branchId, setBranchId] = useState(defaultBranchId ?? '')
  const [productId, setProductId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [movementType, setMovementType] = useState<StockMovementType | ''>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const debouncedSearch = useDebounce(search)

  const ledgerQuery = useInventoryLedgerQuery({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    branchId: branchId || undefined,
    productId: productId || undefined,
    variantId: variantId || undefined,
    movementType: movementType || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const items = useMemo(() => ledgerQuery.data?.items ?? [], [ledgerQuery.data?.items])

  if (ledgerQuery.isLoading) {
    return <LoadingState label="Loading inventory ledger..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory ledger"
        description="Review immutable stock movement history and trace operational references."
      />
      <FilterBar className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <SearchInput value={search} onChange={(event) => {
          setPage(1)
          setSearch(event.target.value)
        }} placeholder="Search reference or SKU..." />
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
        <OptionSelect
          value={movementType}
          onValueChange={(value) => {
            setPage(1)
            setMovementType(value as StockMovementType | '')
          }}
          emptyLabel={t('allMovements')}
          options={STOCK_MOVEMENT_TYPES.map((item) => ({
            value: item,
            label: getStockMovementTypeLabel(t, item),
          }))}
        />
        <div className="grid gap-3 md:grid-cols-2 xl:col-span-2">
          <DatePicker
            value={parseDateValue(startDate)}
            onChange={(date) => {
              setPage(1)
              setStartDate(formatDateForInput(date))
            }}
            placeholder={t('startDate')}
          />
          <DatePicker
            value={parseDateValue(endDate)}
            onChange={(date) => {
              setPage(1)
              setEndDate(formatDateForInput(date))
            }}
            placeholder={t('endDate')}
          />
        </div>
      </FilterBar>
      <DataTable
        columns={[
          { key: 'date', header: 'Date', render: (entry) => formatDateTime(entry.createdAt) },
          { key: 'product', header: 'Product', render: (entry) => <div><p className="font-medium text-slate-900">{getDisplayName(entry.product)}</p><p className="text-xs text-slate-500">{getDisplayName(entry.variant)}</p></div> },
          { key: 'branch', header: 'Branch', render: (entry) => entry.branch.name },
          { key: 'movement', header: 'Movement', render: (entry) => <StatusBadge value={entry.movementType} /> },
          { key: 'reference', header: 'Reference', render: (entry) => <div><p>{entry.referenceType}</p><p className="text-xs text-slate-500">{entry.referenceId ?? '—'}</p></div> },
          { key: 'delta', header: 'Quantity delta', render: (entry) => <QuantityText value={entry.quantityDelta} /> },
          { key: 'before', header: 'Before', render: (entry) => <QuantityText value={entry.beforeOnHand} /> },
          { key: 'after', header: 'After', render: (entry) => <QuantityText value={entry.afterOnHand} /> },
          { key: 'note', header: 'Note', render: (entry) => entry.note ?? '—' },
        ]}
        items={items}
        empty={<EmptyState title="No ledger entries found" description="Stock movement history will appear here once inventory activity is posted." />}
        rowKey={(entry) => entry.id}
      />
      <PaginationControls pagination={ledgerQuery.data?.pagination} onPageChange={setPage} />
    </div>
  )
}
