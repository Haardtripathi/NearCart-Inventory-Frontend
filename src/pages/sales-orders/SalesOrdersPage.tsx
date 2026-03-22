import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { useSalesOrdersQuery } from '@/features/sales-orders/sales-orders.api'
import { BranchSelector, CurrencyText } from '@/components/inventory/selectors'
import { DataTable, EmptyState, FilterBar, LoadingState, PageHeader, PaginationControls, SearchInput, StatusBadge } from '@/components/common'
import { Button, OptionSelect } from '@/components/ui'
import { PAYMENT_STATUSES, SALES_ORDER_STATUSES, type PaymentStatus, type SalesOrderStatus } from '@/types/common'
import { formatDateTime } from '@/lib/utils'
import { getPaymentStatusLabel, getSalesOrderStatusLabel } from '@/lib/labels'

export function SalesOrdersPage() {
  const { t } = useTranslation(['common', 'orders'])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [branchId, setBranchId] = useState('')
  const [status, setStatus] = useState<SalesOrderStatus | ''>('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('')

  const ordersQuery = useSalesOrdersQuery({
    page,
    limit: 20,
    search: search || undefined,
    branchId: branchId || undefined,
    status: status || undefined,
    paymentStatus: paymentStatus || undefined,
  })

  if (ordersQuery.isLoading) {
    return <LoadingState label="Loading sales orders..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales orders"
        description="Create orders, confirm stock deductions, and manage delivery status."
        actions={
          <Button asChild>
            <Link to="/sales-orders/new">
              <Plus className="h-4 w-4" />
              New sales order
            </Link>
          </Button>
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
      <PaginationControls pagination={ordersQuery.data?.pagination} onPageChange={setPage} />
    </div>
  )
}
