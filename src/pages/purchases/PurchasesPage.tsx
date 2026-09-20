import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Download, Plus } from 'lucide-react'

import { fetchAllPurchasesForExport, usePurchasesQuery } from '@/features/purchases/purchases.api'
import { BranchSelector, CurrencyText } from '@/components/inventory/selectors'
import { DataTable, EmptyState, ErrorState, FilterBar, LoadingState, PageHeader, PaginationControls, SearchInput, StatusBadge } from '@/components/common'
import { Button } from '@/components/ui'
import { usePermissions } from '@/hooks/usePermissions'
import { formatDate, parseApiError } from '@/lib/utils'
import { exportRowsAsCsv } from '@/lib/csv-export'

export function PurchasesPage() {
  const { t } = useTranslation('common')
  const permissions = usePermissions()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [branchId, setBranchId] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const filters = { search: search || undefined, branchId: branchId || undefined }
  const purchasesQuery = usePurchasesQuery({ page, limit: 20, ...filters })

  // Same "export the whole filtered set, not just the on-screen page" rationale as
  // SalesOrdersPage.tsx's identical button — see fetchAllPurchasesForExport's doc comment.
  async function handleExport() {
    setIsExporting(true)
    try {
      const purchases = await fetchAllPurchasesForExport(filters)
      if (purchases.length === 0) {
        toast.error('No purchases match the current filters.')
        return
      }
      exportRowsAsCsv(`purchases-${new Date().toISOString().slice(0, 10)}.csv`, purchases, [
        { header: 'Receipt number', accessor: (purchase) => purchase.receiptNumber },
        { header: 'Invoice date', accessor: (purchase) => formatDate(purchase.invoiceDate) },
        { header: 'Received', accessor: (purchase) => formatDate(purchase.receivedAt) },
        { header: 'Supplier', accessor: (purchase) => purchase.supplier?.name },
        { header: 'Branch', accessor: (purchase) => purchase.branch.name },
        { header: 'Status', accessor: (purchase) => purchase.status },
        { header: 'Subtotal', accessor: (purchase) => purchase.subtotal },
        { header: 'Tax', accessor: (purchase) => purchase.taxTotal },
        { header: 'Discount', accessor: (purchase) => purchase.discountTotal },
        { header: 'Total', accessor: (purchase) => purchase.total },
        { header: 'Items', accessor: (purchase) => purchase.items.length },
      ])
      toast.success(`Exported ${purchases.length} purchase${purchases.length === 1 ? '' : 's'}.`)
    } catch (error) {
      toast.error(parseApiError(error).message || 'Could not export purchases.')
    } finally {
      setIsExporting(false)
    }
  }

  if (purchasesQuery.isLoading) {
    return <LoadingState label="Loading purchases..." variant="list" />
  }

  if (purchasesQuery.isError) {
    return <ErrorState description="Purchases could not be loaded right now." onRetry={() => void purchasesQuery.refetch()} />
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <PageHeader
        title="Purchases"
        description="Create draft purchase receipts and post them when stock is received."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void handleExport()} disabled={isExporting}>
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting…' : 'Export CSV'}
            </Button>
            {permissions.canManagePurchases ? (
              <Button asChild>
                <Link to="/purchases/new">
                  <Plus className="h-4 w-4" />
                  New purchase
                </Link>
              </Button>
            ) : null}
          </div>
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
      <div className="rows-animate-in">
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
      </div>
      <PaginationControls pagination={purchasesQuery.data?.pagination} onPageChange={setPage} />
    </div>
  )
}
