import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

import { useInventoryLedgerQuery } from '@/features/inventory/inventory.api'
import { useDebounce } from '@/hooks/useDebounce'
import { BranchSelector, ProductSelector, QuantityText, VariantSelector } from '@/components/inventory/selectors'
import { DataTable, EmptyState, ErrorState, FilterBar, InlineNotice, LoadingState, PageHeader, PaginationControls, SearchInput, StatusBadge } from '@/components/common'
import { Button, DatePicker, OptionSelect } from '@/components/ui'
import { STOCK_MOVEMENT_TYPES, type StockMovementType } from '@/types/common'
import { formatDateForInput, formatDateTime, getDisplayName, parseDateValue } from '@/lib/utils'
import { getStockMovementTypeLabel } from '@/lib/labels'

export function InventoryLedgerPage() {
  const { t } = useTranslation('common')
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [branchId, setBranchId] = useState(searchParams.get('branchId') ?? '')
  const [productId, setProductId] = useState(searchParams.get('productId') ?? '')
  const [variantId, setVariantId] = useState(searchParams.get('variantId') ?? '')
  const [movementType, setMovementType] = useState<StockMovementType | ''>(() => {
    const value = searchParams.get('movementType')
    return value && STOCK_MOVEMENT_TYPES.includes(value as StockMovementType) ? value as StockMovementType : ''
  })
  const [startDate, setStartDate] = useState(searchParams.get('startDate') ?? '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') ?? '')
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
  const hasActiveFilters = Boolean(search.trim() || branchId || productId || variantId || movementType || startDate || endDate)

  if (ledgerQuery.isLoading) {
    return <LoadingState label="Loading inventory ledger..." variant="list" />
  }

  if (ledgerQuery.isError) {
    return <ErrorState description="Inventory ledger could not be loaded right now." onRetry={() => void ledgerQuery.refetch()} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory ledger"
        description="Review immutable stock movement history and trace operational references."
      />
      {hasActiveFilters ? (
        <InlineNotice className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>Ledger history is currently filtered. Clear filters to review stock movement across the whole workspace.</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setPage(1)
              setSearch('')
              setBranchId('')
              setProductId('')
              setVariantId('')
              setMovementType('')
              setStartDate('')
              setEndDate('')
              setSearchParams({})
            }}
          >
            Clear filters
          </Button>
        </InlineNotice>
      ) : null}
      <FilterBar className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <SearchInput value={search} onChange={(event) => {
          setPage(1)
          setSearch(event.target.value)
        }} placeholder={t('searchReferenceOrSkuPlaceholder')} />
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
