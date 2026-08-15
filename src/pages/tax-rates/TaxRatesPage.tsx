import { useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { Plus } from 'lucide-react'

import { useCreateTaxRateMutation, useTaxRatesQuery, useUpdateTaxRateMutation } from '@/features/tax-rates/tax-rates.api'
import { usePermissions } from '@/hooks/usePermissions'
import { useDebounce } from '@/hooks/useDebounce'
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input } from '@/components/ui'
import { ConfirmDialog, DataTable, EmptyState, FilterBar, LoadingState, PageHeader, PaginationControls, SearchInput, StatusBadge } from '@/components/common'
import { CheckboxField, FormField, TranslationFields } from '@/components/forms'
import { getDisplayName, parseApiError } from '@/lib/utils'
import type { TaxRate, TranslationInput } from '@/types/common'

// Backend stores `rate` as the plain percentage number (e.g. `18` for 18%, not `0.18`) — see
// `ensureOrganizationDefaultTaxRates` in the backend's organizations.service.ts, which seeds
// GST0/GST5/GST12/GST18 with rate "0"/"5"/"12"/"18". The form below follows the same convention:
// the number entered is the percentage value itself.
const taxRateSchema = z.object({
  name: z.string().trim().min(1),
  code: z.string().trim().optional(),
  rate: z.coerce.number().min(0, 'Rate must be zero or a positive number'),
  isInclusive: z.boolean().default(false),
  isActive: z.boolean().default(true),
  translations: z.array(z.custom<TranslationInput>()).default([]),
})

export function TaxRatesPage() {
  const { t } = useTranslation(['taxRates', 'common'])
  const permissions = usePermissions()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTaxRate, setEditingTaxRate] = useState<TaxRate | null>(null)
  const [togglingTaxRate, setTogglingTaxRate] = useState<TaxRate | null>(null)

  const debouncedSearch = useDebounce(search)
  const taxRatesQuery = useTaxRatesQuery({ page, limit: 20, search: debouncedSearch || undefined })
  const createTaxRateMutation = useCreateTaxRateMutation()
  const updateTaxRateMutation = useUpdateTaxRateMutation()

  const form = useForm({
    resolver: zodResolver(taxRateSchema),
    defaultValues: { name: '', code: '', rate: 0, isInclusive: false, isActive: true, translations: [] },
  })
  const isInclusive = Boolean(useWatch({ control: form.control, name: 'isInclusive' }))
  const isActive = Boolean(useWatch({ control: form.control, name: 'isActive' }))
  const translations = useWatch({ control: form.control, name: 'translations' })

  const taxRates = useMemo(() => taxRatesQuery.data?.items ?? [], [taxRatesQuery.data?.items])

  const openCreate = () => {
    setEditingTaxRate(null)
    form.reset({ name: '', code: '', rate: 0, isInclusive: false, isActive: true, translations: [] })
    setDialogOpen(true)
  }

  const openEdit = (taxRate: TaxRate) => {
    setEditingTaxRate(taxRate)
    form.reset({
      name: taxRate.name,
      code: taxRate.code ?? '',
      rate: Number(taxRate.rate),
      isInclusive: taxRate.isInclusive,
      isActive: taxRate.isActive,
      translations: taxRate.translations ?? [],
    })
    setDialogOpen(true)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editingTaxRate) {
        await updateTaxRateMutation.mutateAsync({ id: editingTaxRate.id, payload: values })
        toast.success(t('taxRates:updated'))
      } else {
        await createTaxRateMutation.mutateAsync(values)
        toast.success(t('taxRates:created'))
      }
      setDialogOpen(false)
    } catch (error) {
      toast.error(parseApiError(error).message || t('taxRates:saveFailed'))
    }
  })

  if (taxRatesQuery.isLoading) {
    return <LoadingState label={t('loadingData', { ns: 'common' })} variant="list" />
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <PageHeader
        title={t('taxRates:title')}
        description={t('taxRates:description')}
        actions={
          permissions.canManageCatalog ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t('taxRates:addTaxRate')}
            </Button>
          ) : null
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={(event) => {
          setPage(1)
          setSearch(event.target.value)
        }} placeholder={t('taxRates:searchPlaceholder')} />
      </FilterBar>

      <div className="rows-animate-in">
        <DataTable<TaxRate>
          columns={[
            {
              key: 'name',
              header: t('taxRates:name'),
              render: (taxRate) => (
                <div>
                  <p className="font-medium text-slate-900">{getDisplayName(taxRate, taxRate.name)}</p>
                  {taxRate.code ? <p className="text-xs text-slate-500">{taxRate.code}</p> : null}
                </div>
              ),
            },
            {
              key: 'rate',
              header: t('taxRates:rate'),
              render: (taxRate) => <span className="font-mono text-sm font-medium text-slate-900">{Number(taxRate.rate)}%</span>,
            },
            {
              key: 'inclusive',
              header: t('taxRates:taxType'),
              render: (taxRate) => (
                <Badge tone={taxRate.isInclusive ? 'info' : 'muted'}>
                  {taxRate.isInclusive ? t('taxRates:inclusive') : t('taxRates:exclusive')}
                </Badge>
              ),
            },
            { key: 'status', header: t('common:status'), render: (taxRate) => <StatusBadge value={taxRate.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
            {
              key: 'actions',
              header: t('common:actions'),
              render: (taxRate) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(taxRate)} disabled={!permissions.canManageCatalog}>
                    {t('common:edit')}
                  </Button>
                  {taxRate.isActive ? (
                    <Button size="sm" variant="ghost" onClick={() => setTogglingTaxRate(taxRate)} disabled={!permissions.canManageCatalog}>
                      {t('taxRates:deactivateLabel')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!permissions.canManageCatalog || updateTaxRateMutation.isPending}
                      onClick={async () => {
                        try {
                          await updateTaxRateMutation.mutateAsync({ id: taxRate.id, payload: { isActive: true } })
                          toast.success(t('taxRates:activated'))
                        } catch (error) {
                          toast.error(parseApiError(error).message || t('taxRates:activateFailed'))
                        }
                      }}
                    >
                      {t('taxRates:activateLabel')}
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          empty={<EmptyState title={t('taxRates:noTaxRatesTitle')} description={t('taxRates:noTaxRatesDescription')} />}
          items={taxRates}
          rowKey={(taxRate) => taxRate.id}
        />
      </div>

      <PaginationControls pagination={taxRatesQuery.data?.pagination} onPageChange={setPage} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingTaxRate ? t('taxRates:editTaxRate') : t('taxRates:addTaxRate')}</DialogTitle>
            <DialogDescription>
              {editingTaxRate ? t('taxRates:editDialogDescription') : t('taxRates:createDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label={t('taxRates:name')} error={form.formState.errors.name?.message} required>
                <Input placeholder={t('taxRates:namePlaceholder')} {...form.register('name')} />
              </FormField>
              <FormField label={t('taxRates:code')} description={t('taxRates:codeDescription')}>
                <Input placeholder={t('taxRates:codePlaceholder')} {...form.register('code')} />
              </FormField>
            </div>
            <Controller
              control={form.control}
              name="rate"
              render={({ field, fieldState }) => (
                <FormField label={t('taxRates:rate')} error={fieldState.error?.message} description={t('taxRates:rateDescription')} required>
                  <Input
                    step="0.01"
                    min="0"
                    type="number"
                    placeholder={t('taxRates:ratePlaceholder')}
                    value={field.value == null ? '' : String(field.value)}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormField>
              )}
            />
            <CheckboxField
              checked={isInclusive}
              label={t('taxRates:inclusiveLabel')}
              description={t('taxRates:inclusiveDescription')}
              onCheckedChange={(checked) => form.setValue('isInclusive', checked, { shouldDirty: true })}
            />
            <CheckboxField
              checked={isActive}
              label={t('taxRates:active')}
              description={t('taxRates:activeDescription')}
              onCheckedChange={(checked) => form.setValue('isActive', checked, { shouldDirty: true })}
            />
            <FormField label={t('products:languageOverrides')}>
              <TranslationFields
                value={translations}
                onChange={(value) => form.setValue('translations', value as TranslationInput[], { shouldDirty: true })}
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                {t('common:cancel')}
              </Button>
              <Button loading={createTaxRateMutation.isPending || updateTaxRateMutation.isPending} loadingText={editingTaxRate ? t('taxRates:updateTaxRate') : t('taxRates:createTaxRate')} type="submit">
                {editingTaxRate ? t('taxRates:updateTaxRate') : t('taxRates:createTaxRate')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(togglingTaxRate)}
        onOpenChange={(open) => {
          if (!open) {
            setTogglingTaxRate(null)
          }
        }}
        title={t('taxRates:deactivateTitle')}
        description={togglingTaxRate ? t('taxRates:deactivateDescription', { name: togglingTaxRate.name }) : undefined}
        confirmLabel={t('taxRates:deactivateLabel')}
        loading={updateTaxRateMutation.isPending}
        onConfirm={async () => {
          if (!togglingTaxRate) {
            return
          }
          try {
            await updateTaxRateMutation.mutateAsync({ id: togglingTaxRate.id, payload: { isActive: false } })
            toast.success(t('taxRates:deactivated'))
            setTogglingTaxRate(null)
          } catch (error) {
            toast.error(parseApiError(error).message || t('taxRates:deactivateFailed'))
          }
        }}
      />
    </div>
  )
}
