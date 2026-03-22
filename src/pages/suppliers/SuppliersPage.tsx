import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { Plus } from 'lucide-react'

import { useCreateSupplierMutation, useDeleteSupplierMutation, useSuppliersQuery, useUpdateSupplierMutation } from '@/features/suppliers/suppliers.api'
import { usePermissions } from '@/hooks/usePermissions'
import { useDebounce } from '@/hooks/useDebounce'
import { ConfirmDialog, DataTable, EmptyState, FilterBar, LoadingState, PageHeader, PaginationControls, SearchInput, StatusBadge } from '@/components/common'
import { CheckboxField, FormField, TranslationFields } from '@/components/forms'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Textarea } from '@/components/ui'
import { getDisplayName } from '@/lib/utils'
import type { Supplier, TranslationInput } from '@/types/common'

const supplierSchema = z.object({
  name: z.string().trim().min(1),
  code: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  taxNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  isActive: z.boolean().default(true),
  translations: z.array(z.custom<TranslationInput>()).default([]),
})

export function SuppliersPage() {
  const { t } = useTranslation(['suppliers', 'common'])
  const permissions = usePermissions()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)
  const debouncedSearch = useDebounce(search)
  const suppliersQuery = useSuppliersQuery({ page, limit: 12, search: debouncedSearch || undefined })
  const createSupplierMutation = useCreateSupplierMutation()
  const updateSupplierMutation = useUpdateSupplierMutation()
  const deleteSupplierMutation = useDeleteSupplierMutation()

  const form = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: '', code: '', phone: '', email: '', taxNumber: '', notes: '', isActive: true, translations: [] },
  })
  const isActive = Boolean(useWatch({ control: form.control, name: 'isActive' }))

  const items = useMemo(() => suppliersQuery.data?.items ?? [], [suppliersQuery.data?.items])

  const openCreate = () => {
    setEditingSupplier(null)
    form.reset({ name: '', code: '', phone: '', email: '', taxNumber: '', notes: '', isActive: true, translations: [] })
    setDialogOpen(true)
  }

  const openEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    form.reset({
      name: supplier.name,
      code: supplier.code ?? '',
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      taxNumber: supplier.taxNumber ?? '',
      notes: supplier.notes ?? '',
      isActive: supplier.isActive,
      translations: supplier.translations ?? [],
    })
    setDialogOpen(true)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editingSupplier) {
        await updateSupplierMutation.mutateAsync({ id: editingSupplier.id, payload: values })
        toast.success(t('suppliers:updated'))
      } else {
        await createSupplierMutation.mutateAsync(values)
        toast.success(t('suppliers:created'))
      }
      setDialogOpen(false)
    } catch {
      toast.error(t('suppliers:saveFailed'))
    }
  })

  if (suppliersQuery.isLoading) {
    return <LoadingState label={t('loadingData', { ns: 'common' })} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('suppliers:title')}
        description={t('suppliers:description')}
        actions={permissions.canManageCatalog ? <Button onClick={openCreate}><Plus className="h-4 w-4" />{t('suppliers:addSupplier')}</Button> : null}
      />
      <FilterBar>
        <SearchInput value={search} onChange={(event) => {
          setPage(1)
          setSearch(event.target.value)
        }} placeholder={t('suppliers:searchPlaceholder')} />
      </FilterBar>
      <DataTable
        columns={[
          { key: 'name', header: t('suppliers:name'), render: (supplier) => <div><p className="font-medium text-slate-900">{getDisplayName(supplier, supplier.name)}</p><p className="text-xs text-slate-500">{supplier.code ?? 'No code'}</p></div> },
          { key: 'contact', header: t('suppliers:contactDetails'), render: (supplier) => supplier.phone || supplier.email || '—' },
          { key: 'tax', header: t('suppliers:taxNumber'), render: (supplier) => supplier.taxNumber || '—' },
          { key: 'status', header: t('common:status'), render: (supplier) => <StatusBadge value={supplier.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
          {
            key: 'actions',
            header: t('common:actions'),
            render: (supplier) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(supplier)} disabled={!permissions.canManageCatalog}>{t('common:edit')}</Button>
                <Button size="sm" variant="ghost" onClick={() => setDeletingSupplier(supplier)} disabled={!permissions.canManageCatalog}>{t('common:archive')}</Button>
              </div>
            ),
          },
        ]}
        items={items}
        empty={<EmptyState title={t('suppliers:noSuppliersTitle')} description={t('suppliers:noSuppliersDescription')} />}
        rowKey={(supplier) => supplier.id}
      />
      <PaginationControls pagination={suppliersQuery.data?.pagination} onPageChange={setPage} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? t('suppliers:editSupplier') : t('suppliers:addSupplier')}</DialogTitle>
          </DialogHeader>
          <form className="space-y-5" onSubmit={onSubmit}>
            <FormField label={t('suppliers:name')} error={form.formState.errors.name?.message} required>
              <Input placeholder={t('suppliers:namePlaceholder')} {...form.register('name')} />
            </FormField>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label={t('suppliers:code')}>
                <Input placeholder={t('suppliers:codePlaceholder')} {...form.register('code')} />
              </FormField>
              <FormField label={t('suppliers:taxNumber')}>
                <Input placeholder={t('suppliers:taxNumberPlaceholder')} {...form.register('taxNumber')} />
              </FormField>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label={t('common:phone')}>
                <Input placeholder={t('common:phonePlaceholder')} {...form.register('phone')} />
              </FormField>
              <FormField label={t('common:email')}>
                <Input placeholder={t('common:emailPlaceholder')} {...form.register('email')} />
              </FormField>
            </div>
            <FormField label={t('common:notes')}>
              <Textarea placeholder={t('common:notesPlaceholder')} {...form.register('notes')} />
            </FormField>
            <CheckboxField
              checked={isActive}
              label={t('suppliers:active')}
              description={t('suppliers:activeDescription')}
              onCheckedChange={(checked) => form.setValue('isActive', checked, { shouldDirty: true })}
            />
            <FormField label={t('products:languageOverrides')}>
              <TranslationFields
                value={form.watch('translations')}
                onChange={(value) => form.setValue('translations', value as TranslationInput[], { shouldDirty: true })}
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t('common:cancel')}</Button>
              <Button disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending} type="submit">
                {editingSupplier ? t('suppliers:updateSupplier') : t('suppliers:createSupplier')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingSupplier)}
        onOpenChange={(open) => !open && setDeletingSupplier(null)}
        title={t('suppliers:archiveTitle')}
        description={deletingSupplier ? t('suppliers:archiveDescription', { name: deletingSupplier.name }) : undefined}
        confirmLabel={t('suppliers:archiveLabel')}
        onConfirm={async () => {
          if (!deletingSupplier) return
          try {
            await deleteSupplierMutation.mutateAsync(deletingSupplier.id)
            toast.success(t('suppliers:archived'))
            setDeletingSupplier(null)
          } catch {
            toast.error(t('suppliers:archiveFailed'))
          }
        }}
      />
    </div>
  )
}
