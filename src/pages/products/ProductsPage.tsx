import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Plus, Upload } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { useBrandsQuery } from '@/features/brands/brands.api'
import { useCategoriesQuery } from '@/features/categories/categories.api'
import { useDeleteProductMutation, useProductsQuery } from '@/features/products/products.api'
import { usePermissions } from '@/hooks/usePermissions'
import { useDebounce } from '@/hooks/useDebounce'
import { ConfirmDialog, DataTable, EmptyState, FilterBar, LoadingState, PageHeader, PaginationControls, SearchInput, StatusBadge } from '@/components/common'
import { Button, OptionSelect } from '@/components/ui'
import { getDisplayName } from '@/lib/utils'
import { PRODUCT_STATUSES, type ProductStatus } from '@/types/common'

export function ProductsPage() {
  const { t } = useTranslation(['products', 'common'])
  const permissions = usePermissions()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ProductStatus | ''>('')
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [hasVariants, setHasVariants] = useState('')
  const [archivingProductId, setArchivingProductId] = useState<string | null>(null)
  const debouncedSearch = useDebounce(search)

  const productsQuery = useProductsQuery({
    page,
    limit: 16,
    search: debouncedSearch || undefined,
    status: status || undefined,
    categoryId: categoryId || undefined,
    brandId: brandId || undefined,
    hasVariants: hasVariants ? hasVariants === 'true' : undefined,
  })
  const categoriesQuery = useCategoriesQuery({ page: 1, limit: 100 })
  const brandsQuery = useBrandsQuery({ page: 1, limit: 100 })
  const deleteProductMutation = useDeleteProductMutation()

  const products = useMemo(() => productsQuery.data?.items ?? [], [productsQuery.data?.items])

  if (productsQuery.isLoading) {
    return <LoadingState label={t('loadingProducts')} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('listDescription')}
        actions={
          <div className="flex flex-wrap gap-2">
            {permissions.canManageMasterImports ? (
              <Button asChild variant="outline">
                <Link to="/master-catalog">
                  <Upload className="h-4 w-4" />
                  {t('importFromMaster')}
                </Link>
              </Button>
            ) : null}
            {permissions.canManageProducts ? (
              <Button asChild>
                <Link to="/products/new">
                  <Plus className="h-4 w-4" />
                  {t('addProduct')}
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <FilterBar className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SearchInput value={search} onChange={(event) => {
          setPage(1)
          setSearch(event.target.value)
        }} placeholder={t('searchPlaceholder')} />
        <OptionSelect
          value={status}
          onValueChange={(value) => {
            setPage(1)
            setStatus(value as ProductStatus | '')
          }}
          emptyLabel={t('allStatuses')}
          options={PRODUCT_STATUSES.map((item) => ({ value: item, label: t(`statusValues.${item}`, { defaultValue: item }) }))}
        />
        <OptionSelect
          value={categoryId}
          onValueChange={(value) => {
            setPage(1)
            setCategoryId(value)
          }}
          emptyLabel={t('allCategories')}
          options={(categoriesQuery.data?.items ?? []).map((category) => ({
            value: category.id,
            label: getDisplayName(category),
          }))}
        />
        <OptionSelect
          value={brandId}
          onValueChange={(value) => {
            setPage(1)
            setBrandId(value)
          }}
          emptyLabel={t('allBrands')}
          options={(brandsQuery.data?.items ?? []).map((brand) => ({
            value: brand.id,
            label: brand.name,
          }))}
        />
        <OptionSelect
          value={hasVariants}
          onValueChange={(value) => {
            setPage(1)
            setHasVariants(value)
          }}
          emptyLabel={t('anyType')}
          options={[
            { value: 'true', label: t('hasVariantsFilter') },
            { value: 'false', label: t('simpleOnly') },
          ]}
        />
      </FilterBar>

      <DataTable
        columns={[
          { key: 'name', header: t('product'), render: (product) => <div><p className="font-medium text-slate-900">{getDisplayName(product)}</p><p className="text-xs text-slate-500">{product.variants.map((variant) => variant.sku).join(', ')}</p></div> },
          { key: 'category', header: t('category', { ns: 'common' }), render: (product) => product.category ? getDisplayName(product.category) : '—' },
          { key: 'brand', header: t('brand'), render: (product) => product.brand?.name ?? '—' },
          { key: 'type', header: t('type', { ns: 'common' }), render: (product) => t(`typeValues.${product.productType}`, { defaultValue: product.productType }) },
          { key: 'status', header: t('status', { ns: 'common' }), render: (product) => <StatusBadge value={t(`statusValues.${product.status}`, { defaultValue: product.status })} /> },
          { key: 'variants', header: t('variantsCount'), render: (product) => product.variants.length },
          {
            key: 'actions',
            header: t('actions', { ns: 'common' }),
            render: (product) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/products/${product.id}`}>{t('view', { ns: 'common' })}</Link>
                </Button>
                {permissions.canManageProducts ? (
                  <>
                    <Button size="sm" variant="ghost" asChild>
                      <Link to={`/products/${product.id}/edit`}>{t('edit', { ns: 'common' })}</Link>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setArchivingProductId(product.id)}>
                      {t('archive', { ns: 'common' })}
                    </Button>
                  </>
                ) : null}
              </div>
            ),
          },
        ]}
        items={products}
        empty={
          <EmptyState
            title={t('noProductsTitle')}
            description={t('noProductsDescription')}
            action={permissions.canManageProducts ? (
              <Button asChild>
                <Link to="/products/new">
                  <Plus className="h-4 w-4" />
                  {t('addProduct')}
                </Link>
              </Button>
            ) : undefined}
          />
        }
        rowKey={(product) => product.id}
      />
      <PaginationControls pagination={productsQuery.data?.pagination} onPageChange={setPage} />

      <ConfirmDialog
        open={Boolean(archivingProductId)}
        onOpenChange={(open) => !open && setArchivingProductId(null)}
        title={t('archiveTitle')}
        description={t('archiveDescription')}
        confirmLabel={t('archive', { ns: 'common' })}
        onConfirm={async () => {
          if (!archivingProductId) return
          try {
            await deleteProductMutation.mutateAsync(archivingProductId)
            toast.success(t('archivedSuccess'))
            setArchivingProductId(null)
          } catch {
            toast.error(t('archiveFailed'))
          }
        }}
      />
    </div>
  )
}
