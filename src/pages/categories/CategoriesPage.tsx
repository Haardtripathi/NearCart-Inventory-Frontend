import { useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { Plus } from 'lucide-react'

import { useCategoriesQuery, useCategoryTreeQuery, useCreateCategoryMutation, useDeleteCategoryMutation, useUpdateCategoryMutation } from '@/features/categories/categories.api'
import { usePermissions } from '@/hooks/usePermissions'
import { useDebounce } from '@/hooks/useDebounce'
import { ConfirmDialog, DataTable, EmptyState, FilterBar, LoadingState, PageHeader, PaginationControls, SearchInput, StatusBadge } from '@/components/common'
import { CheckboxField, ControlledSelect, FormField, TranslationFields } from '@/components/forms'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Textarea } from '@/components/ui'
import { getDisplayName, parseApiError } from '@/lib/utils'
import type { Category, TranslationInput } from '@/types/common'

const categorySchema = z.object({
  parentId: z.string().trim().optional(),
  name: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  translations: z.array(z.custom<TranslationInput>()).default([]),
})

type CategoryFormValues = z.infer<typeof categorySchema>

function normalizeCategoryPayload(values: CategoryFormValues) {
  const translations = (values.translations ?? [])
    .map((translation) => ({
      ...translation,
      name: translation.name?.trim() ?? '',
      description: translation.description?.trim() || undefined,
    }))
    .filter((translation) => translation.name || translation.description)

  const invalidTranslation = translations.find((translation) => !translation.name)

  if (invalidTranslation) {
    throw new Error(`Translation name is required for ${invalidTranslation.language}`)
  }

  return {
    parentId: values.parentId?.trim() || undefined,
    name: values.name.trim(),
    slug: values.slug?.trim() || undefined,
    description: values.description?.trim() || undefined,
    sortOrder: values.sortOrder,
    isActive: values.isActive,
    translations,
  }
}

function CategoryTreeView({ items }: { items: Category[] }) {
  const { t } = useTranslation(['categories', 'common'])

  if (!items.length) {
    return <EmptyState title={t('noCategoriesTitle')} description={t('noCategoriesDescription')} />
  }

  return (
    <div className="space-y-3">
      {items.map((category) => (
        <div key={category.id} className="rounded-md border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-slate-900">{getDisplayName(category)}</p>
            <StatusBadge value={category.isActive ? 'ACTIVE' : 'INACTIVE'} />
          </div>
          {category.children?.length ? (
            <div className="mt-4 space-y-3 border-l border-dashed border-border pl-4">
              <CategoryTreeView items={category.children} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export function CategoriesPage() {
  const { t } = useTranslation(['categories', 'common'])
  const permissions = usePermissions()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'tree'>('list')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const debouncedSearch = useDebounce(search)

  const categoriesQuery = useCategoriesQuery({ page, limit: 12, search: debouncedSearch || undefined })
  const categoryTreeQuery = useCategoryTreeQuery()
  const createCategoryMutation = useCreateCategoryMutation()
  const updateCategoryMutation = useUpdateCategoryMutation()
  const deleteCategoryMutation = useDeleteCategoryMutation()
  const parentOptions = useMemo(() => categoriesQuery.data?.items ?? [], [categoriesQuery.data?.items])
  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      parentId: '',
      name: '',
      slug: '',
      description: '',
      sortOrder: 0,
      isActive: true,
      translations: [],
    },
  })
  const isActive = Boolean(useWatch({ control: form.control, name: 'isActive' }))

  const openCreate = () => {
    setEditingCategory(null)
    form.reset({ parentId: '', name: '', slug: '', description: '', sortOrder: 0, isActive: true, translations: [] })
    setDialogOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditingCategory(category)
    form.reset({
      parentId: category.parentId ?? '',
      name: category.name ?? '',
      slug: category.slug,
      description: category.description ?? '',
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      translations: category.translations ?? [],
    })
    setDialogOpen(true)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = normalizeCategoryPayload(values)

      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({ id: editingCategory.id, payload })
        toast.success(t('updated'))
      } else {
        await createCategoryMutation.mutateAsync(payload)
        toast.success(t('created'))
      }
      setDialogOpen(false)
    } catch (error) {
      toast.error(parseApiError(error).message)
    }
  })

  if (categoriesQuery.isLoading && categoryTreeQuery.isLoading) {
    return <LoadingState label={t('loadingCategories')} variant="list" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('categories', { ns: 'common' })}
        title={t('title')}
        description={t('description')}
        actions={
          permissions.canManageCatalog ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t('addCategory')}
            </Button>
          ) : null
        }
      />
      <FilterBar className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <SearchInput value={search} onChange={(event) => {
          setPage(1)
          setSearch(event.target.value)
        }} placeholder={t('searchPlaceholder')} />
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50/80 p-1">
          <Button size="sm" variant={view === 'list' ? 'default' : 'ghost'} onClick={() => setView('list')}>
            {t('listView')}
          </Button>
          <Button size="sm" variant={view === 'tree' ? 'default' : 'ghost'} onClick={() => setView('tree')}>
            {t('treeView')}
          </Button>
        </div>
      </FilterBar>

      {view === 'list' ? (
        <>
          <DataTable
            columns={[
              { key: 'name', header: t('category'), render: (category) => <div><p className="font-medium text-slate-900">{getDisplayName(category)}</p><p className="text-xs text-slate-500">{category.slug}</p></div> },
              { key: 'parent', header: t('parent'), render: (category) => category.parent ? getDisplayName(category.parent) : '—' },
              { key: 'children', header: t('children'), render: (category) => category.children?.length ?? 0 },
              { key: 'status', header: t('status', { ns: 'common' }), render: (category) => <StatusBadge value={category.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
              {
                key: 'actions',
                header: t('actions', { ns: 'common' }),
                render: (category) => (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(category)} disabled={!permissions.canManageCatalog}>{t('edit', { ns: 'common' })}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeletingCategory(category)} disabled={!permissions.canManageCatalog}>{t('archive', { ns: 'common' })}</Button>
                  </div>
                ),
              },
            ]}
            items={categoriesQuery.data?.items ?? []}
            empty={<EmptyState title={t('noCategoriesTitle')} description={t('noCategoriesDescription')} />}
            rowKey={(category) => category.id}
          />
          <PaginationControls pagination={categoriesQuery.data?.pagination} onPageChange={setPage} />
        </>
      ) : (
        <CategoryTreeView items={categoryTreeQuery.data ?? []} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingCategory ? t('editCategory') : t('addCategory')}</DialogTitle>
          </DialogHeader>
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label={t('name', { ns: 'common' })} error={form.formState.errors.name?.message} required>
                <Input placeholder={t('namePlaceholder')} {...form.register('name')} />
              </FormField>
              <FormField label={t('slug')} description={t('slugDescription')}>
                <Input placeholder={t('slugPlaceholder')} {...form.register('slug')} />
              </FormField>
              <FormField label={t('parentCategory')}>
                <ControlledSelect
                  control={form.control}
                  name="parentId"
                  placeholder={t('noParent')}
                  emptyOptionLabel={t('noParent')}
                  options={parentOptions
                    .filter((item) => item.id !== editingCategory?.id)
                    .map((category) => ({
                      value: category.id,
                      label: getDisplayName(category),
                    }))}
                />
              </FormField>
              <FormField label={t('sortOrder')}>
                <Input type="number" {...form.register('sortOrder')} />
              </FormField>
            </div>
            <FormField label={t('descriptionLabel', { ns: 'common' })}>
              <Textarea placeholder={t('descriptionPlaceholder')} {...form.register('description')} />
            </FormField>
            <CheckboxField
              checked={isActive}
              label={t('active', { ns: 'common' })}
              description={t('activeDescription')}
              onCheckedChange={(checked) => form.setValue('isActive', checked, { shouldDirty: true })}
            />
            <Controller
              control={form.control}
              name="translations"
              render={({ field }) => (
                <FormField label={t('translations')}>
                  <TranslationFields value={field.value} onChange={field.onChange} />
                </FormField>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>{t('cancel', { ns: 'common' })}</Button>
              <Button loading={createCategoryMutation.isPending || updateCategoryMutation.isPending} loadingText={editingCategory ? t('updateCategory') : t('createCategory')} type="submit">
                {editingCategory ? t('updateCategory') : t('createCategory')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        title={t('archiveTitle')}
        description={deletingCategory ? t('archiveDescription', { name: getDisplayName(deletingCategory) }) : undefined}
        confirmLabel={t('archive', { ns: 'common' })}
        onConfirm={async () => {
          if (!deletingCategory) return
          try {
            await deleteCategoryMutation.mutateAsync(deletingCategory.id)
            toast.success(t('archived'))
            setDeletingCategory(null)
          } catch {
            toast.error(t('archiveFailed'))
          }
        }}
      />
    </div>
  )
}
