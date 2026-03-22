import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { Plus } from 'lucide-react'

import { useCreateCustomerMutation, useCustomersQuery, useDeleteCustomerMutation, useUpdateCustomerMutation } from '@/features/customers/customers.api'
import { usePermissions } from '@/hooks/usePermissions'
import { useDebounce } from '@/hooks/useDebounce'
import { ConfirmDialog, DataTable, EmptyState, FilterBar, LoadingState, PageHeader, PaginationControls, SearchInput, StatusBadge } from '@/components/common'
import { CheckboxField, FormField } from '@/components/forms'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Textarea } from '@/components/ui'
import type { Customer } from '@/types/common'
import { getDisplayName } from '@/lib/utils'

const customerSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  isActive: z.boolean().default(true),
})

export function CustomersPage() {
  const { t } = useTranslation(['customers', 'common'])
  const permissions = usePermissions()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)
  const debouncedSearch = useDebounce(search)

  const customersQuery = useCustomersQuery({ page, limit: 12, search: debouncedSearch || undefined })
  const createCustomerMutation = useCreateCustomerMutation()
  const updateCustomerMutation = useUpdateCustomerMutation()
  const deleteCustomerMutation = useDeleteCustomerMutation()
  const form = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', phone: '', email: '', notes: '', isActive: true },
  })
  const isActive = Boolean(useWatch({ control: form.control, name: 'isActive' }))

  const items = useMemo(() => customersQuery.data?.items ?? [], [customersQuery.data?.items])

  const openCreate = () => {
    setEditingCustomer(null)
    form.reset({ name: '', phone: '', email: '', notes: '', isActive: true })
    setDialogOpen(true)
  }

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    form.reset({
      name: customer.name,
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      notes: customer.notes ?? '',
      isActive: customer.isActive,
    })
    setDialogOpen(true)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editingCustomer) {
        await updateCustomerMutation.mutateAsync({ id: editingCustomer.id, payload: values })
        toast.success(t('customers:updated'))
      } else {
        await createCustomerMutation.mutateAsync(values)
        toast.success(t('customers:created'))
      }
      setDialogOpen(false)
    } catch {
      toast.error(t('customers:saveFailed'))
    }
  })

  if (customersQuery.isLoading) {
    return <LoadingState label={t('loadingData', { ns: 'common' })} variant="list" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('customers:title')}
        description={t('customers:description')}
        actions={permissions.canManageCatalog ? <Button onClick={openCreate}><Plus className="h-4 w-4" />{t('customers:addCustomer')}</Button> : null}
      />
      <FilterBar>
        <SearchInput value={search} onChange={(event) => {
          setPage(1)
          setSearch(event.target.value)
        }} placeholder={t('customers:searchPlaceholder')} />
      </FilterBar>
      <DataTable
        columns={[
          { key: 'name', header: t('customers:name'), render: (customer) => <span className="font-medium text-slate-900">{getDisplayName(customer)}</span> },
          { key: 'contact', header: t('common:phone'), render: (customer) => customer.phone || customer.email || '—' },
          { key: 'status', header: t('common:status'), render: (customer) => <StatusBadge value={customer.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
          {
            key: 'actions',
            header: t('common:actions'),
            render: (customer) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(customer)} disabled={!permissions.canManageCatalog}>{t('common:edit')}</Button>
                <Button size="sm" variant="ghost" onClick={() => setDeletingCustomer(customer)} disabled={!permissions.canManageCatalog}>{t('common:archive')}</Button>
              </div>
            ),
          },
        ]}
        items={items}
        empty={<EmptyState title={t('customers:noCustomersTitle')} description={t('customers:noCustomersDescription')} />}
        rowKey={(customer) => customer.id}
      />
      <PaginationControls pagination={customersQuery.data?.pagination} onPageChange={setPage} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? t('customers:editCustomer') : t('customers:addCustomer')}</DialogTitle>
          </DialogHeader>
          <form className="space-y-5" onSubmit={onSubmit}>
            <FormField label={t('customers:name')} error={form.formState.errors.name?.message} required>
              <Input placeholder={t('customers:namePlaceholder')} {...form.register('name')} />
            </FormField>
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
              label={t('customers:active')}
              description={t('customers:activeDescription')}
              onCheckedChange={(checked) => form.setValue('isActive', checked, { shouldDirty: true })}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>{t('common:cancel')}</Button>
              <Button loading={createCustomerMutation.isPending || updateCustomerMutation.isPending} loadingText={editingCustomer ? t('customers:updateCustomer') : t('customers:createCustomer')} type="submit">
                {editingCustomer ? t('customers:updateCustomer') : t('customers:createCustomer')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingCustomer)}
        onOpenChange={(open) => !open && setDeletingCustomer(null)}
        title={t('customers:archiveTitle')}
        description={deletingCustomer ? t('customers:archiveDescription', { name: deletingCustomer.name }) : undefined}
        confirmLabel={t('customers:archiveLabel')}
        onConfirm={async () => {
          if (!deletingCustomer) return
          try {
            await deleteCustomerMutation.mutateAsync(deletingCustomer.id)
            toast.success(t('customers:archived'))
            setDeletingCustomer(null)
          } catch {
            toast.error(t('customers:archiveFailed'))
          }
        }}
      />
    </div>
  )
}
