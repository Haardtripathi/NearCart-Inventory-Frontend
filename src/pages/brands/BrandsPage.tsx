import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { Plus } from 'lucide-react'

import { useBrandsQuery, useCreateBrandMutation, useDeleteBrandMutation, useUpdateBrandMutation } from '@/features/brands/brands.api'
import { usePermissions } from '@/hooks/usePermissions'
import { useDebounce } from '@/hooks/useDebounce'
import { ConfirmDialog, DataTable, EmptyState, FilterBar, LoadingState, PageHeader, PaginationControls, SearchInput, StatusBadge } from '@/components/common'
import { CheckboxField, FormField, TranslationFields } from '@/components/forms'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input } from '@/components/ui'
import { getDisplayName } from '@/lib/utils'
import type { Brand, TranslationInput } from '@/types/common'

const brandSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  isActive: z.boolean().default(true),
  translations: z.array(z.custom<TranslationInput>()).default([]),
})

export function BrandsPage() {
  const { t } = useTranslation(['brands', 'common'])
  const permissions = usePermissions()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null)

  const debouncedSearch = useDebounce(search)
  const brandsQuery = useBrandsQuery({ page, limit: 12, search: debouncedSearch || undefined })
  const createBrandMutation = useCreateBrandMutation()
  const updateBrandMutation = useUpdateBrandMutation()
  const deleteBrandMutation = useDeleteBrandMutation()
  const form = useForm({
    resolver: zodResolver(brandSchema),
    defaultValues: { name: '', slug: '', isActive: true, translations: [] },
  })
  const isActive = Boolean(useWatch({ control: form.control, name: 'isActive' }))

  const brands = useMemo(() => brandsQuery.data?.items ?? [], [brandsQuery.data?.items])

  const openCreate = () => {
    setEditingBrand(null)
    form.reset({ name: '', slug: '', isActive: true, translations: [] })
    setIsDialogOpen(true)
  }

  const openEdit = (brand: Brand) => {
    setEditingBrand(brand)
    form.reset({
      name: brand.name,
      slug: brand.slug,
      isActive: brand.isActive,
      translations: brand.translations ?? [],
    })
    setIsDialogOpen(true)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editingBrand) {
        await updateBrandMutation.mutateAsync({ id: editingBrand.id, payload: values })
        toast.success(t('brands:updated'))
      } else {
        await createBrandMutation.mutateAsync(values)
        toast.success(t('brands:created'))
      }
      setIsDialogOpen(false)
    } catch {
      toast.error(t('brands:saveFailed'))
    }
  })

  if (brandsQuery.isLoading) {
    return <LoadingState label={t('loadingData', { ns: 'common' })} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('brands:title')}
        description={t('brands:description')}
        actions={
          permissions.canManageCatalog ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t('brands:addBrand')}
            </Button>
          ) : null
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={(event) => {
          setPage(1)
          setSearch(event.target.value)
        }} placeholder={t('brands:searchPlaceholder')} />
      </FilterBar>

      <DataTable
        columns={[
          { key: 'name', header: t('brands:name'), render: (brand) => <span className="font-medium text-slate-900">{getDisplayName(brand, brand.name)}</span> },
          { key: 'slug', header: t('brands:slug'), render: (brand) => brand.slug },
          { key: 'status', header: t('common:status'), render: (brand) => <StatusBadge value={brand.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
          {
            key: 'actions',
            header: t('common:actions'),
            render: (brand) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(brand)} disabled={!permissions.canManageCatalog}>
                  {t('common:edit')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeletingBrand(brand)} disabled={!permissions.canManageCatalog}>
                  {t('common:archive')}
                </Button>
              </div>
            ),
          },
        ]}
        empty={<EmptyState title={t('brands:noBrandsTitle')} description={t('brands:noBrandsDescription')} />}
        items={brands}
        rowKey={(brand) => brand.id}
      />

      <PaginationControls pagination={brandsQuery.data?.pagination} onPageChange={setPage} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingBrand ? t('brands:editBrand') : t('brands:addBrand')}</DialogTitle>
          </DialogHeader>
          <form className="space-y-5" onSubmit={onSubmit}>
            <FormField label={t('brands:name')} error={form.formState.errors.name?.message} required>
              <Input placeholder={t('brands:namePlaceholder')} {...form.register('name')} />
            </FormField>
            <FormField label={t('brands:slug')} error={form.formState.errors.slug?.message} description={t('brands:slugDescription')}>
              <Input placeholder={t('brands:slugPlaceholder')} {...form.register('slug')} />
            </FormField>
            <CheckboxField
              checked={isActive}
              label={t('brands:active')}
              description={t('brands:activeDescription')}
              onCheckedChange={(checked) => form.setValue('isActive', checked, { shouldDirty: true })}
            />
            <FormField label={t('products:languageOverrides')}>
              <TranslationFields
                value={form.watch('translations')}
                onChange={(value) => form.setValue('translations', value as TranslationInput[], { shouldDirty: true })}
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                {t('common:cancel')}
              </Button>
              <Button loading={createBrandMutation.isPending || updateBrandMutation.isPending} loadingText={editingBrand ? t('brands:updateBrand') : t('brands:createBrand')} type="submit">
                {editingBrand ? t('brands:updateBrand') : t('brands:createBrand')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingBrand)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingBrand(null)
          }
        }}
        title={t('brands:archiveTitle')}
        description={deletingBrand ? t('brands:archiveDescription', { name: deletingBrand.name }) : undefined}
        confirmLabel={t('brands:archiveLabel')}
        onConfirm={async () => {
          if (!deletingBrand) {
            return
          }
          try {
            await deleteBrandMutation.mutateAsync(deletingBrand.id)
            toast.success(t('brands:archived'))
            setDeletingBrand(null)
          } catch {
            toast.error(t('brands:archiveFailed'))
          }
        }}
      />
    </div>
  )
}
