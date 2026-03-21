import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { Plus } from 'lucide-react'

import { useUnitsQuery, useCreateUnitMutation } from '@/features/units/units.api'
import { usePermissions } from '@/hooks/usePermissions'
import { useDebounce } from '@/hooks/useDebounce'
import { DataTable, EmptyState, FilterBar, LoadingState, PageHeader, PaginationControls, SearchInput, StatusBadge } from '@/components/common'
import { CheckboxField, FormField } from '@/components/forms'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input } from '@/components/ui'
import { getDisplayName } from '@/lib/utils'
import type { Unit } from '@/types/common'

const unitSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  symbol: z.string().trim().optional(),
  allowsDecimal: z.boolean().default(false),
})

export function UnitsPage() {
  const { t } = useTranslation(['units', 'common'])
  const permissions = usePermissions()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const debouncedSearch = useDebounce(search)
  const unitsQuery = useUnitsQuery({ page, limit: 20, search: debouncedSearch || undefined })
  const createUnitMutation = useCreateUnitMutation()

  const form = useForm({
    resolver: zodResolver(unitSchema),
    defaultValues: { code: '', name: '', symbol: '', allowsDecimal: false },
  })
  const allowsDecimal = Boolean(useWatch({ control: form.control, name: 'allowsDecimal' }))

  const units = useMemo(() => unitsQuery.data?.items ?? [], [unitsQuery.data?.items])

  const openCreate = () => {
    form.reset({ code: '', name: '', symbol: '', allowsDecimal: false })
    setDialogOpen(true)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createUnitMutation.mutateAsync(values)
      toast.success(t('units:created'))
      setDialogOpen(false)
    } catch {
      toast.error(t('units:saveFailed'))
    }
  })

  if (unitsQuery.isLoading) {
    return <LoadingState label={t('common:loadingData')} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('units:title')}
        description={t('units:description')}
        actions={
          permissions.canManageCatalog ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t('units:addUnit')}
            </Button>
          ) : null
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={(event) => {
          setPage(1)
          setSearch(event.target.value)
        }} placeholder={t('units:searchPlaceholder')} />
      </FilterBar>

      <DataTable<Unit>
        columns={[
          { key: 'code', header: t('units:code'), render: (unit) => <span className="font-mono text-sm font-medium text-slate-900">{unit.code}</span> },
          { key: 'name', header: t('units:name'), render: (unit) => getDisplayName(unit, unit.name) },
          { key: 'symbol', header: t('units:symbol'), render: (unit) => unit.symbol || '—' },
          { key: 'decimal', header: t('units:allowsDecimal'), render: (unit) => <StatusBadge value={unit.allowsDecimal ? 'ACTIVE' : 'INACTIVE'} /> },
          { key: 'source', header: t('common:type'), render: (unit) => (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${unit.isSystem ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
              {unit.isSystem ? t('units:system') : t('units:custom')}
            </span>
          )},
        ]}
        empty={<EmptyState title={t('units:noUnitsTitle')} description={t('units:noUnitsDescription')} />}
        items={units}
        rowKey={(unit) => unit.id}
      />

      <PaginationControls pagination={unitsQuery.data?.pagination} onPageChange={setPage} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('units:addUnit')}</DialogTitle>
          </DialogHeader>
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label={t('units:code')} error={form.formState.errors.code?.message} required>
                <Input placeholder={t('units:codePlaceholder')} {...form.register('code')} />
              </FormField>
              <FormField label={t('units:name')} error={form.formState.errors.name?.message} required>
                <Input placeholder={t('units:namePlaceholder')} {...form.register('name')} />
              </FormField>
            </div>
            <FormField label={t('units:symbol')}>
              <Input placeholder={t('units:symbolPlaceholder')} {...form.register('symbol')} />
            </FormField>
            <CheckboxField
              checked={allowsDecimal}
              label={t('units:allowsDecimal')}
              description={t('units:allowsDecimalDescription')}
              onCheckedChange={(checked) => form.setValue('allowsDecimal', checked, { shouldDirty: true })}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                {t('common:cancel')}
              </Button>
              <Button disabled={createUnitMutation.isPending} type="submit">
                {t('units:createUnit')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
