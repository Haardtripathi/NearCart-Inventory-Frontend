import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { useStockTransfersQuery } from '@/features/stock-transfers/stock-transfers.api'
import { BranchSelector } from '@/components/inventory/selectors'
import { DataTable, EmptyState, FilterBar, LoadingState, PageHeader, PaginationControls, SearchInput, StatusBadge } from '@/components/common'
import { Button } from '@/components/ui'
import { formatDateTime } from '@/lib/utils'

export function StockTransfersPage() {
  const { t } = useTranslation('common')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [fromBranchId, setFromBranchId] = useState('')
  const [toBranchId, setToBranchId] = useState('')

  const transfersQuery = useStockTransfersQuery({
    page,
    limit: 20,
    search: search || undefined,
    fromBranchId: fromBranchId || undefined,
    toBranchId: toBranchId || undefined,
  })

  if (transfersQuery.isLoading) {
    return <LoadingState label="Loading stock transfers..." variant="list" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock transfers"
        description="Move stock between branches using draft, approve, and cancel workflows."
        actions={
          <Button asChild>
            <Link to="/stock-transfers/new">
              <Plus className="h-4 w-4" />
              New transfer
            </Link>
          </Button>
        }
      />
      <FilterBar className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <SearchInput value={search} onChange={(event) => {
          setPage(1)
          setSearch(event.target.value)
        }} placeholder={t('searchTransfersPlaceholder')} />
        <BranchSelector includeAll value={fromBranchId} onChange={(value) => {
          setPage(1)
          setFromBranchId(value)
        }} />
        <BranchSelector includeAll value={toBranchId} onChange={(value) => {
          setPage(1)
          setToBranchId(value)
        }} />
      </FilterBar>
      <DataTable
        columns={[
          { key: 'transfer', header: 'Transfer number', render: (transfer) => <Link className="font-medium text-slate-900 hover:text-primary" to={`/stock-transfers/${transfer.id}`}>{transfer.transferNumber}</Link> },
          { key: 'from', header: 'From', render: (transfer) => transfer.fromBranch.name },
          { key: 'to', header: 'To', render: (transfer) => transfer.toBranch.name },
          { key: 'status', header: 'Status', render: (transfer) => <StatusBadge value={transfer.status} /> },
          { key: 'createdAt', header: 'Created', render: (transfer) => formatDateTime(transfer.createdAt) },
        ]}
        items={transfersQuery.data?.items ?? []}
        empty={<EmptyState title="No stock transfers yet" description="Create a transfer to move inventory between branches." />}
        rowKey={(transfer) => transfer.id}
      />
      <PaginationControls pagination={transfersQuery.data?.pagination} onPageChange={setPage} />
    </div>
  )
}
