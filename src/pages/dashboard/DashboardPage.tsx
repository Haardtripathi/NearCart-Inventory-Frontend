import { Link } from 'react-router-dom'
import { ArrowRight, Boxes, PackageSearch, ShoppingCart, Store, TrendingDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useDashboardQuery } from '@/features/dashboard/dashboard.api'
import { CurrencyText, QuantityText } from '@/components/inventory/selectors'
import { Button, Card, CardContent } from '@/components/ui'
import { EmptyState, ErrorState, LoadingState, MetricCard, PageHeader, SectionCard, StatusBadge } from '@/components/common'
import { formatDateTime, getDisplayName } from '@/lib/utils'

const cardMeta = [
  {
    key: 'totalProducts',
    labelKey: 'totalProducts',
    icon: Boxes,
    tone: 'bg-sky-50 text-sky-700',
  },
  {
    key: 'activeProducts',
    labelKey: 'activeProducts',
    icon: PackageSearch,
    tone: 'bg-emerald-50 text-emerald-700',
  },
  {
    key: 'lowStockItems',
    labelKey: 'lowStockItems',
    icon: TrendingDown,
    tone: 'bg-amber-50 text-amber-700',
  },
  {
    key: 'pendingSalesOrders',
    labelKey: 'pendingSalesOrders',
    icon: ShoppingCart,
    tone: 'bg-violet-50 text-violet-700',
  },
  {
    key: 'totalBranches',
    labelKey: 'totalBranches',
    icon: Store,
    tone: 'bg-slate-100 text-slate-700',
  },
] as const

export function DashboardPage() {
  const { t } = useTranslation(['dashboard', 'common'])
  const dashboardQuery = useDashboardQuery()

  if (dashboardQuery.isLoading) {
    return <LoadingState label={t('loadingData', { ns: 'common' })} />
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return <ErrorState description="The dashboard could not be loaded from the available backend endpoints." onRetry={() => void dashboardQuery.refetch()} />
  }

  const dashboard = dashboardQuery.data

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button asChild variant="outline">
            <Link to="/master-catalog">
              {t('browseMasterCatalog')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cardMeta.map((card) => {
          const Icon = card.icon
          const value =
            card.key === 'lowStockItems'
              ? dashboard.lowStockItems.length
              : dashboard[card.key]

          return (
            <MetricCard
              key={card.key}
              label={t(card.labelKey)}
              value={value}
              caption={t('liveSnapshot')}
              icon={<Icon className="h-5 w-5" />}
              tone={card.tone}
            />
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title={t('lowStockPreview')} description={t('lowStockPreviewDescription')}>
          {dashboard.lowStockItems.length ? (
            <div className="space-y-3">
              {dashboard.lowStockItems.map((row) => (
                <div key={row.id} className="rounded-md border border-amber-100 bg-amber-50/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{getDisplayName(row.product)}</p>
                      <p className="text-sm text-slate-500">{getDisplayName(row.variant)} · {row.branch.name}</p>
                    </div>
                    <StatusBadge value="LOW_STOCK" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <span>{t('onHand')}: <QuantityText value={row.onHand} /></span>
                    <span>{t('available')}: <QuantityText value={row.available} /></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t('noLowStockTitle')} description={t('noLowStockDescription')} />
          )}
        </SectionCard>

        <SectionCard title={t('recentMovements')} description={t('recentMovementsDescription')}>
          {dashboard.recentMovements.length ? (
            <div className="space-y-3">
              {dashboard.recentMovements.map((entry) => (
                <div key={entry.id} className="rounded-md border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{getDisplayName(entry.product)}</p>
                      <p className="text-sm text-slate-500">{entry.branch.name} · {formatDateTime(entry.createdAt)}</p>
                    </div>
                    <StatusBadge value={entry.movementType} />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {t('quantityLabel')}: <QuantityText value={entry.quantityDelta} /> · {t('referenceLabel')}: {entry.referenceType}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t('noRecentMovementsTitle')} description={t('noRecentMovementsDescription')} />
          )}
        </SectionCard>

        <SectionCard title={t('recentOrders')} description={t('recentOrdersDescription')}>
          {dashboard.recentOrders.length ? (
            <div className="space-y-3">
              {dashboard.recentOrders.map((order) => (
                <div key={order.id} className="rounded-md border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{order.orderNumber}</p>
                      <p className="text-sm text-slate-500">{order.branch.name} · {formatDateTime(order.createdAt)}</p>
                    </div>
                    <StatusBadge value={order.status} />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {t('paymentLabel')}: {order.paymentStatus} · {t('total', { ns: 'common' })}: <CurrencyText value={order.total} />
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t('noRecentOrdersTitle')} description={t('noRecentOrdersDescription')} />
          )}
        </SectionCard>
      </div>

      <SectionCard title={t('importedItems')} description={t('importedDescription')}>
        {dashboard.importedMasterProducts.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboard.importedMasterProducts.slice(0, 8).map((product) => (
              <Card key={product.id} className="border-dashed">
                <CardContent className="p-4">
                  <p className="font-medium text-slate-900">{getDisplayName(product)}</p>
                  <p className="mt-1 text-sm text-slate-500">{product.masterCatalogItem?.canonicalName ?? t('importedFallback')}</p>
                  <div className="mt-3">
                    <StatusBadge value={product.sourceType} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title={t('noImportedTitle')} description={t('noImportedDescription')} />
        )}
      </SectionCard>
    </div>
  )
}
