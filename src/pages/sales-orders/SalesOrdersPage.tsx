import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Download, Plus } from 'lucide-react'

import { fetchAllSalesOrdersForExport, useSalesOrdersQuery } from '@/features/sales-orders/sales-orders.api'
import { BranchSelector, CurrencyText } from '@/components/inventory/selectors'
import { DataTable, EmptyState, ErrorState, FilterBar, LoadingState, PageHeader, PaginationControls, SearchInput, StatusBadge } from '@/components/common'
import { Button, OptionSelect } from '@/components/ui'
import { PAYMENT_STATUSES, SALES_ORDER_STATUSES, type PaymentStatus, type SalesOrderStatus } from '@/types/common'
import { formatDateTime, parseApiError } from '@/lib/utils'
import { exportRowsAsCsv } from '@/lib/csv-export'
import { getPaymentStatusLabel, getSalesOrderStatusLabel } from '@/lib/labels'

export function SalesOrdersPage() {
  const { t } = useTranslation(['common', 'orders'])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [branchId, setBranchId] = useState('')
  const [status, setStatus] = useState<SalesOrderStatus | ''>('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('')
  const [isExporting, setIsExporting] = useState(false)

  const filters = {
    search: search || undefined,
    branchId: branchId || undefined,
    status: status || undefined,
    paymentStatus: paymentStatus || undefined,
  }

  const ordersQuery = useSalesOrdersQuery({ page, limit: 20, ...filters })

  // Exports every order matching the CURRENT filters, not just the 20-row page on screen — a shop
  // owner reconciling a day's/month's sales wants the whole filtered set in one file, not a manual
  // page-by-page copy. Re-fetches directly (bypassing the paginated on-screen query/cache) since
  // this needs every page, not just the one currently rendered.
  async function handleExport() {
    setIsExporting(true)
    try {
      const orders = await fetchAllSalesOrdersForExport(filters)
      if (orders.length === 0) {
        toast.error('No sales orders match the current filters.')
        return
      }
      exportRowsAsCsv(`sales-orders-${new Date().toISOString().slice(0, 10)}.csv`, orders, [
        { header: 'Order number', accessor: (order) => order.orderNumber },
        { header: 'Date', accessor: (order) => formatDateTime(order.createdAt) },
        { header: 'Customer', accessor: (order) => order.customer?.name ?? 'Walk-in' },
        { header: 'Branch', accessor: (order) => order.branch.name },
        { header: 'Source', accessor: (order) => order.source },
        { header: 'Status', accessor: (order) => order.status },
        { header: 'Payment status', accessor: (order) => order.paymentStatus },
        { header: 'Subtotal', accessor: (order) => order.subtotal },
        { header: 'Tax', accessor: (order) => order.taxTotal },
        { header: 'Discount', accessor: (order) => order.discountTotal },
        { header: 'Total', accessor: (order) => order.total },
        { header: 'Items', accessor: (order) => order.items.length },
      ])
      toast.success(`Exported ${orders.length} order${orders.length === 1 ? '' : 's'}.`)
    } catch (error) {
      toast.error(parseApiError(error).message || 'Could not export sales orders.')
    } finally {
      setIsExporting(false)
    }
  }

  if (ordersQuery.isLoading) {
    return <LoadingState label="Loading sales orders..." variant="list" />
  }

  if (ordersQuery.isError) {
    return <ErrorState description="Sales orders could not be loaded right now." onRetry={() => void ordersQuery.refetch()} />
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <PageHeader
        title="Sales orders"
        description="Create orders, confirm stock deductions, and manage delivery status."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void handleExport()} disabled={isExporting}>
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting…' : 'Export CSV'}
            </Button>
            <Button asChild>
              <Link to="/sales-orders/new">
                <Plus className="h-4 w-4" />
                New sales order
              </Link>
            </Button>
          </div>
        }
      />
      <FilterBar className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SearchInput value={search} onChange={(event) => {
          setPage(1)
          setSearch(event.target.value)
        }} placeholder={t('searchOrdersPlaceholder', { ns: 'common' })} />
        <BranchSelector includeAll value={branchId} onChange={(value) => {
          setPage(1)
          setBranchId(value)
        }} />
        <OptionSelect
          value={status}
          onValueChange={(value) => {
            setPage(1)
            setStatus(value as SalesOrderStatus | '')
          }}
          emptyLabel={t('allStatuses', { ns: 'common' })}
          options={SALES_ORDER_STATUSES.map((item) => ({ value: item, label: getSalesOrderStatusLabel(t, item) }))}
        />
        <OptionSelect
          value={paymentStatus}
          onValueChange={(value) => {
            setPage(1)
            setPaymentStatus(value as PaymentStatus | '')
          }}
          emptyLabel={t('allPaymentStatuses', { ns: 'common' })}
          options={PAYMENT_STATUSES.map((item) => ({ value: item, label: getPaymentStatusLabel(t, item) }))}
        />
      </FilterBar>
      <div className="rows-animate-in">
        <DataTable
          columns={[
            { key: 'order', header: 'Order number', render: (order) => <Link className="font-medium text-slate-900 hover:text-primary" to={`/sales-orders/${order.id}`}>{order.orderNumber}</Link> },
            { key: 'customer', header: 'Customer', render: (order) => order.customer?.name ?? 'Walk-in' },
            { key: 'branch', header: 'Branch', render: (order) => order.branch.name },
            { key: 'source', header: 'Source', render: (order) => order.source },
            { key: 'status', header: 'Status', render: (order) => <StatusBadge value={order.status} /> },
            { key: 'payment', header: 'Payment', render: (order) => <StatusBadge value={order.paymentStatus} /> },
            { key: 'total', header: 'Total', render: (order) => <CurrencyText value={order.total} /> },
            { key: 'createdAt', header: 'Created', render: (order) => formatDateTime(order.createdAt) },
          ]}
          items={ordersQuery.data?.items ?? []}
          empty={<EmptyState title="No sales orders yet" description="Create an order to reserve and move stock through fulfillment." />}
          rowKey={(order) => order.id}
        />
      </div>
      <PaginationControls pagination={ordersQuery.data?.pagination} onPageChange={setPage} />
    </div>
  )
}
