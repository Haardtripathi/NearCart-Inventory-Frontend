import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useBranchesQuery } from '@/features/branches/branches.api'
import { useProductsQuery, useProductVariantsQuery } from '@/features/products/products.api'
import { formatCurrency, formatNumber, getDisplayName } from '@/lib/utils'
import { OptionSelect } from '@/components/ui'

export function BranchSelector({
  value,
  onChange,
  includeAll = false,
}: {
  value?: string
  onChange: (value: string) => void
  includeAll?: boolean
}) {
  const { t } = useTranslation('common')
  const { data } = useBranchesQuery({ page: 1, limit: 100 })

  return (
    <OptionSelect
      value={value ?? ''}
      onValueChange={onChange}
      placeholder={t('selectBranch')}
      emptyLabel={includeAll ? t('allBranches') : undefined}
      options={(data?.items ?? []).map((branch) => ({
        value: branch.id,
        label: getDisplayName(branch),
      }))}
    />
  )
}

export function ProductSelector({
  value,
  onChange,
  includeAll = false,
}: {
  value?: string
  onChange: (value: string) => void
  includeAll?: boolean
}) {
  const { t } = useTranslation('common')
  const { data } = useProductsQuery({ page: 1, limit: 100 })

  return (
    <OptionSelect
      value={value ?? ''}
      onValueChange={onChange}
      placeholder={t('selectProduct')}
      emptyLabel={includeAll ? t('allProducts') : undefined}
      options={(data?.items ?? []).map((product) => ({
        value: product.id,
        label: getDisplayName(product),
      }))}
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
