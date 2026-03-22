import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { usePurchasesQuery } from '@/features/purchases/purchases.api'
import { BranchSelector, CurrencyText } from '@/components/inventory/selectors'
import { DataTable, EmptyState, FilterBar, LoadingState, PageHeader, PaginationControls, SearchInput, StatusBadge } from '@/components/common'
import { Button } from '@/components/ui'
import { formatDate } from '@/lib/utils'

export function PurchasesPage() {
  const { t } = useTranslation('common')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [branchId, setBranchId] = useState('')

  const purchasesQuery = usePurchasesQuery({
    page,
    limit: 20,
    search: search || undefined,
    branchId: branchId || undefined,
  })

  if (purchasesQuery.isLoading) {
    return <LoadingState label="Loading purchases..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchases"
        description="Create draft purchase receipts and post them when stock is received."
        actions={
          <Button asChild>
            <Link to="/purchases/new">
              <Plus className="h-4 w-4" />
              New purchase
            </Link>
          </Button>
        }
      />
      <FilterBar className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <SearchInput value={search} onChange={(event) => {
          setPage(1)
          setSearch(event.target.value)
        }} placeholder={t('searchPurchasesPlaceholder')} />
        <BranchSelector includeAll value={branchId} onChange={(value) => {
          setPage(1)
          setBranchId(value)
        }} />
      </FilterBar>
      <DataTable
        columns={[
          { key: 'receipt', header: 'Receipt number', render: (purchase) => <Link className="font-medium text-slate-900 hover:text-primary" to={`/purchases/${purchase.id}`}>{purchase.receiptNumber}</Link> },
          { key: 'supplier', header: 'Supplier', render: (purchase) => purchase.supplier?.name ?? '—' },
          { key: 'branch', header: 'Branch', render: (purchase) => purchase.branch.name },
          { key: 'status', header: 'Status', render: (purchase) => <StatusBadge value={purchase.status} /> },
          { key: 'total', header: 'Total', render: (purchase) => <CurrencyText value={purchase.total} /> },
          { key: 'invoiceDate', header: 'Invoice date', render: (purchase) => formatDate(purchase.invoiceDate) },
        ]}
        items={purchasesQuery.data?.items ?? []}
        empty={<EmptyState title="No purchases yet" description="Create a purchase receipt to bring stock into a branch." />}
        rowKey={(purchase) => purchase.id}
      />
      <PaginationControls pagination={purchasesQuery.data?.pagination} onPageChange={setPage} />
    </div>
  )
}
