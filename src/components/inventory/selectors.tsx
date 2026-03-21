import { useMemo } from 'react'

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
  const { data } = useBranchesQuery({ page: 1, limit: 100 })

  return (
    <OptionSelect
      value={value ?? ''}
      onValueChange={onChange}
      placeholder="Select branch"
      emptyLabel={includeAll ? 'All branches' : undefined}
      options={(data?.items ?? []).map((branch) => ({
        value: branch.id,
        label: branch.name,
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
  const { data } = useProductsQuery({ page: 1, limit: 100 })

  return (
    <OptionSelect
      value={value ?? ''}
      onValueChange={onChange}
      placeholder="Select product"
      emptyLabel={includeAll ? 'All products' : undefined}
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
  const { data } = useProductVariantsQuery(productId)

  const variants = useMemo(() => data ?? [], [data])

  return (
    <OptionSelect
      value={value ?? ''}
      onValueChange={onChange}
      placeholder={productId ? 'Select variant' : 'Select product first'}
      emptyLabel={includeAll ? 'All variants' : undefined}
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
