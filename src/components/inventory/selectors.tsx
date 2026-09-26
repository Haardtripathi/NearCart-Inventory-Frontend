import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useBranchesQuery } from '@/features/branches/branches.api'
import { useProductVariantsQuery } from '@/features/products/products.api'
import { api, unwrapResponse } from '@/lib/axios'
import { formatCurrency, formatNumber, getDisplayName } from '@/lib/utils'
import { OptionSelect } from '@/components/ui'
import { AsyncCombobox } from '@/components/ui/async-combobox'
import type { PaginatedResponse } from '@/types/api'
import type { Brand, Customer, Supplier } from '@/types/common'
import type { Product } from '@/types/product'

export function BranchSelector({
  value,
  onChange,
  includeAll = false,
  addActionLabel,
  onAddAction,
}: {
  value?: string
  onChange: (value: string) => void
  includeAll?: boolean
  addActionLabel?: string
  onAddAction?: () => void
}) {
  const { t } = useTranslation('common')
  const { data } = useBranchesQuery({ page: 1, limit: 100 })

  return (
    <OptionSelect
      value={value ?? ''}
      onValueChange={onChange}
      placeholder={t('selectBranch')}
      emptyLabel={includeAll ? t('allBranches') : undefined}
      addActionLabel={addActionLabel}
      onAddAction={onAddAction}
      options={(data?.items ?? []).map((branch) => ({
        value: branch.id,
        label: getDisplayName(branch),
      }))}
    />
  )
}

// Products, customers, suppliers and brands are all unbounded per-organization lists, so these
// selectors search + page server-side via AsyncCombobox instead of loading a fixed first page
// (previously `{ page: 1, limit: 100 }`, which silently hid everything past the newest 100).
export function ProductSelector({
  value,
  onChange,
  includeAll = false,
  addActionLabel,
  onAddAction,
}: {
  value?: string
  onChange: (value: string) => void
  includeAll?: boolean
  addActionLabel?: string
  onAddAction?: () => void
}) {
  const { t } = useTranslation('common')

  return (
    <AsyncCombobox<Product>
      value={value}
      onChange={onChange}
      queryKey={['products']}
      fetchPage={(params) => unwrapResponse<PaginatedResponse<Product>>(api.get('/products', { params }))}
      fetchById={(id) => unwrapResponse<Product>(api.get(`/products/${id}`))}
      getOptionValue={(product) => product.id}
      getOptionLabel={(product) => getDisplayName(product)}
      placeholder={t('selectProduct')}
      searchPlaceholder={t('searchProductOrSkuPlaceholder')}
      emptyLabel={includeAll ? t('allProducts') : undefined}
      addActionLabel={addActionLabel}
      onAddAction={onAddAction}
    />
  )
}

type EntitySelectorProps = {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  emptyLabel?: string
  searchPlaceholder?: string
  addActionLabel?: string
  onAddAction?: () => void
}

export function CustomerSelector(props: EntitySelectorProps) {
  return (
    <AsyncCombobox<Customer>
      {...props}
      queryKey={['customers']}
      fetchPage={(params) => unwrapResponse<PaginatedResponse<Customer>>(api.get('/customers', { params }))}
      fetchById={(id) => unwrapResponse<Customer>(api.get(`/customers/${id}`))}
      getOptionValue={(customer) => customer.id}
      getOptionLabel={(customer) => getDisplayName(customer)}
    />
  )
}

export function SupplierSelector(props: EntitySelectorProps) {
  return (
    <AsyncCombobox<Supplier>
      {...props}
      queryKey={['suppliers']}
      fetchPage={(params) => unwrapResponse<PaginatedResponse<Supplier>>(api.get('/suppliers', { params }))}
      fetchById={(id) => unwrapResponse<Supplier>(api.get(`/suppliers/${id}`))}
      getOptionValue={(supplier) => supplier.id}
      getOptionLabel={(supplier) => supplier.name}
    />
  )
}

export function BrandSelector(props: EntitySelectorProps) {
  return (
    <AsyncCombobox<Brand>
      {...props}
      queryKey={['brands']}
      fetchPage={(params) => unwrapResponse<PaginatedResponse<Brand>>(api.get('/brands', { params }))}
      fetchById={(id) => unwrapResponse<Brand>(api.get(`/brands/${id}`))}
      getOptionValue={(brand) => brand.id}
      getOptionLabel={(brand) => getDisplayName(brand, brand.name)}
    />
  )
}

export function VariantSelector({
  productId,
  value,
  onChange,
  includeAll = false,
}: {
  productId?: string
  value?: string
  onChange: (value: string) => void
  includeAll?: boolean
}) {
  const { t } = useTranslation('common')
  const { data } = useProductVariantsQuery(productId)

  const variants = useMemo(() => data ?? [], [data])

  return (
    <OptionSelect
      value={value ?? ''}
      onValueChange={onChange}
      placeholder={productId ? t('selectVariant') : t('selectProductFirst')}
      emptyLabel={includeAll ? t('allVariants') : undefined}
      disabled={!productId}
      options={variants.map((variant) => ({
        value: variant.id,
        label: `${getDisplayName(variant)} (${variant.sku})`,
      }))}
    />
  )
}

export function CurrencyText({ value, currency = 'INR' }: { value?: string | number | null; currency?: string }) {
  return <span>{formatCurrency(value ?? null, currency)}</span>
}

export function QuantityText({ value }: { value?: string | number | null }) {
  return <span>{formatNumber(value ?? null, 3)}</span>
}
