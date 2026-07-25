import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, ShoppingCart, Store, Users } from 'lucide-react'

import { usePlatformOrganizationsOverviewQuery } from '@/features/platform/platform.api'
import { usePermissions } from '@/hooks/usePermissions'
import {
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  LoadingState,
  MetricCard,
  PageHeader,
  SearchInput,
  SectionCard,
  StatusBadge,
} from '@/components/common'
import { formatDateTime } from '@/lib/utils'

export function PlatformOrganizationsPage() {
  const { t } = useTranslation(['platform', 'common'])
  const permissions = usePermissions()
  const [search, setSearch] = useState('')
  const overviewQuery = usePlatformOrganizationsOverviewQuery(permissions.canViewPlatformOverview)

  const organizations = useMemo(() => {
    const items = overviewQuery.data ?? []
    const query = search.trim().toLowerCase()

    if (!query) {
      return items
    }

    return items.filter((organization) =>
      [organization.name, organization.slug].some((value) => value.toLowerCase().includes(query)),
    )
  }, [overviewQuery.data, search])

  const totals = useMemo(() => {
    const items = overviewQuery.data ?? []

    return {
      organizations: items.length,
      active: items.filter((organization) => organization.status?.toLowerCase() === 'active').length,
      branches: items.reduce((sum, organization) => sum + organization.branchCount, 0),
      salesOrders: items.reduce((sum, organization) => sum + organization.salesOrderCount, 0),
    }
  }, [overviewQuery.data])

  if (!permissions.canViewPlatformOverview) {
    return <EmptyState title={t('restrictedTitle')} description={t('restrictedDescription')} />
  }

  if (overviewQuery.isLoading) {
    return <LoadingState label={t('loadingData', { ns: 'common' })} variant="dashboard" />
  }

  if (overviewQuery.isError) {
    return <ErrorState description={t('loadFailedDescription')} onRetry={() => void overviewQuery.refetch()} />
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Platform" title={t('organizationsTitle')} description={t('organizationsDescription')} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t('totalOrganizations')}
          value={totals.organizations}
          icon={<Building2 className="h-5 w-5" />}
          tone="bg-sky-50 text-sky-700"
        />
        <MetricCard
          label={t('activeOrganizations')}
          value={totals.active}
          icon={<Building2 className="h-5 w-5" />}
          tone="bg-emerald-50 text-emerald-700"
        />
        <MetricCard
          label={t('totalBranches')}
          value={totals.branches}
          icon={<Store className="h-5 w-5" />}
          tone="bg-violet-50 text-violet-700"
        />
        <MetricCard
          label={t('totalSalesOrders')}
          value={totals.salesOrders}
          icon={<ShoppingCart className="h-5 w-5" />}
          tone="bg-amber-50 text-amber-700"
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('searchPlaceholder')} />
      </FilterBar>

      <SectionCard title={t('organizationsTitle')} description={t('organizationsDescription')}>
        <DataTable
          items={organizations}
          rowKey={(organization) => organization.id}
          empty={<EmptyState title={t('noOrganizationsTitle')} description={t('noOrganizationsDescription')} />}
          columns={[
            {
              key: 'organization',
              header: t('organizationColumn'),
              render: (organization) => (
                <div>
                  <p className="font-medium text-slate-900">{organization.name}</p>
                  <p className="text-xs text-slate-500">{organization.slug}</p>
                </div>
              ),
            },
            {
              key: 'status',
              header: t('statusColumn'),
              render: (organization) => <StatusBadge value={organization.status} />,
            },
            {
              key: 'branches',
              header: t('branchesColumn'),
              render: (organization) => (
                <span className="inline-flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 text-slate-400" />
                  {organization.branchCount}
                </span>
              ),
            },
            {
              key: 'members',
              header: t('membersColumn'),
              render: (organization) => (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  {organization.memberCount}
                </span>
              ),
            },
            {
              key: 'salesOrders',
              header: t('salesOrdersColumn'),
              render: (organization) => (
                <span className="inline-flex items-center gap-1.5">
                  <ShoppingCart className="h-3.5 w-3.5 text-slate-400" />
                  {organization.salesOrderCount}
                </span>
              ),
            },
            {
              key: 'lastActivity',
              header: t('lastActivityColumn'),
              render: (organization) =>
                organization.lastSalesOrderAt ? formatDateTime(organization.lastSalesOrderAt) : t('noActivityYet'),
            },
          ]}
        />
      </SectionCard>
    </div>
  )
}
