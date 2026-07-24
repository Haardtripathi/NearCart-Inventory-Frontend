import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'

import { usePlatformDriversQuery, useSuspendDriverMutation, useVerifyDriverMutation } from '@/features/drivers/drivers.api'
import { usePermissions } from '@/hooks/usePermissions'
import { AccessDeniedPage } from '@/pages/errors/AccessDeniedPage'
import { ConfirmDialog, DataTable, EmptyState, ErrorState, FilterBar, LoadingState, PageHeader, StatusBadge } from '@/components/common'
import { Button, OptionSelect } from '@/components/ui'
import { DRIVER_STATUSES, type Driver, type DriverStatus } from '@/types/common'
import { getDriverStatusLabel } from '@/lib/labels'
import { parseApiError } from '@/lib/utils'

export function DriversPage() {
  const { t } = useTranslation('common')
  const permissions = usePermissions()
  const [status, setStatus] = useState<DriverStatus | ''>('')
  const [suspendingDriver, setSuspendingDriver] = useState<Driver | null>(null)

  const driversQuery = usePlatformDriversQuery(status)
  const verifyMutation = useVerifyDriverMutation()
  const suspendMutation = useSuspendDriverMutation()

  if (!permissions.canManageDrivers) {
    return <AccessDeniedPage />
  }

  if (driversQuery.isLoading) {
    return <LoadingState label="Loading drivers..." variant="list" />
  }

  if (driversQuery.isError) {
    return <ErrorState description="Drivers could not be loaded right now." onRetry={() => void driversQuery.refetch()} />
  }

  const drivers = driversQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers"
        description="Verify or suspend drivers in the platform-wide delivery pool. Any shop's staff can assign a verified driver to a ready order."
      />

      <FilterBar className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
        <OptionSelect
          value={status}
          onValueChange={(value) => setStatus(value as DriverStatus | '')}
          emptyLabel={t('allStatuses')}
          options={DRIVER_STATUSES.map((item) => ({ value: item, label: getDriverStatusLabel(t, item) }))}
        />
      </FilterBar>

      <DataTable
        items={drivers}
        rowKey={(driver) => driver.id}
        empty={<EmptyState title="No drivers found" description="No drivers match this filter yet. Drivers appear here once they self-register in the NearCart driver app." />}
        columns={[
          {
            key: 'identity',
            header: 'Driver',
            render: (driver) => (
              <div>
                <p className="font-medium text-slate-900">{driver.fullName}</p>
                <p className="text-xs text-slate-500">{driver.phone}{driver.email ? ` · ${driver.email}` : ''}</p>
              </div>
            ),
          },
          {
            key: 'vehicle',
            header: 'Vehicle',
            render: (driver) => (
              <div>
                <p className="text-slate-700">{driver.vehicleType}</p>
                <p className="text-xs text-slate-500">{driver.vehicleNumber}</p>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (driver) => <StatusBadge value={driver.status} />,
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (driver) => (
              <div className="flex gap-2">
                {driver.status !== 'VERIFIED' ? (
                  <Button
                    size="sm"
                    loading={verifyMutation.isPending}
                    loadingText="Verifying..."
                    onClick={async () => {
                      try {
                        await verifyMutation.mutateAsync(driver.id)
                        toast.success(`${driver.fullName} verified`)
                      } catch (error) {
                        toast.error(parseApiError(error).message)
                      }
                    }}
                  >
                    Verify
                  </Button>
                ) : null}
                {driver.status === 'VERIFIED' ? (
                  <Button size="sm" variant="outline" onClick={() => setSuspendingDriver(driver)}>
                    Suspend
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
      />

      <ConfirmDialog
        open={Boolean(suspendingDriver)}
        onOpenChange={(open) => {
          if (!open) {
            setSuspendingDriver(null)
          }
        }}
        title="Suspend driver"
        description={suspendingDriver ? `${suspendingDriver.fullName} will no longer be assignable to orders until re-verified.` : undefined}
        confirmLabel="Suspend"
        destructive
        onConfirm={async () => {
          if (!suspendingDriver) {
            return
          }
          try {
            await suspendMutation.mutateAsync(suspendingDriver.id)
            toast.success(`${suspendingDriver.fullName} suspended`)
            setSuspendingDriver(null)
          } catch (error) {
            toast.error(parseApiError(error).message)
          }
        }}
      />
    </div>
  )
}
