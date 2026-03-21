import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuditLogsQuery } from '@/features/audit/audit.api'
import { usePermissions } from '@/hooks/usePermissions'
import { AccessDeniedPage } from '@/pages/errors/AccessDeniedPage'
import { DataTable, EmptyState, FilterBar, LoadingState, PageHeader, PaginationControls, SearchInput, StatusBadge } from '@/components/common'
import { DatePicker, Input, OptionSelect } from '@/components/ui'
import { AUDIT_ACTIONS, type AuditAction } from '@/types/common'
import { formatDateForInput, formatDateTime, parseDateValue } from '@/lib/utils'
import { getAuditActionLabel } from '@/lib/labels'

export function AuditLogsPage() {
  const { t } = useTranslation('common')
  const permissions = usePermissions()
  const [page, setPage] = useState(1)
  const [action, setAction] = useState<AuditAction | ''>('')
  const [entityType, setEntityType] = useState('')
  const [actor, setActor] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const auditQuery = useAuditLogsQuery({
    page,
    limit: 20,
    action: action || undefined,
    entityType: entityType || undefined,
    actor: actor || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  if (!permissions.canViewAuditLogs) {
    return <AccessDeniedPage />
  }

  if (auditQuery.isLoading) {
    return <LoadingState label="Loading audit logs..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit logs"
        description="Read-only activity history for organization actions, stock posting, and key workflow changes."
      />
      <FilterBar className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <SearchInput value={actor} onChange={(event) => {
          setPage(1)
          setActor(event.target.value)
        }} placeholder="Actor name or email..." />
        <Input value={entityType} onChange={(event) => {
          setPage(1)
          setEntityType(event.target.value)
        }} placeholder="Entity type..." />
        <OptionSelect
          value={action}
          onValueChange={(value) => {
            setPage(1)
            setAction(value as AuditAction | '')
          }}
          emptyLabel={t('allActions')}
          options={AUDIT_ACTIONS.map((item) => ({
            value: item,
            label: getAuditActionLabel(t, item),
          }))}
        />
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
      </FilterBar>
      <DataTable
        columns={[
          { key: 'time', header: 'Time', render: (log) => formatDateTime(log.createdAt) },
          { key: 'action', header: 'Action', render: (log) => <StatusBadge value={log.action} /> },
          { key: 'entityType', header: 'Entity type', render: (log) => log.entityType },
          { key: 'entityId', header: 'Entity ID', render: (log) => log.entityId ?? '—' },
          { key: 'actor', header: 'Actor', render: (log) => log.actorUser?.fullName ?? log.actorUser?.email ?? 'System' },
          { key: 'meta', header: 'Meta preview', render: (log) => <span className="text-xs text-slate-500">{JSON.stringify(log.meta ?? {}).slice(0, 90) || '—'}</span> },
        ]}
        items={auditQuery.data?.items ?? []}
        empty={<EmptyState title="No audit logs found" description="Try adjusting your filters or confirm that audit data exists for this organization." />}
        rowKey={(log) => log.id}
      />
      <PaginationControls pagination={auditQuery.data?.pagination} onPageChange={setPage} />
    </div>
  )
}
