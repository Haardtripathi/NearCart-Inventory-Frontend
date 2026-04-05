import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

import { useInventoryBalancesQuery, useInventoryLedgerQuery } from '@/features/inventory/inventory.api'
import { useProductQuery } from '@/features/products/products.api'
import { CurrencyText, QuantityText } from '@/components/inventory/selectors'
import { DataTable, DetailGrid, DetailItem, EmptyState, InlineNotice, LoadingState, PageHeader, SectionCard, StatusBadge } from '@/components/common'
import { Button } from '@/components/ui'
import { formatDateTime, formatNumber, getDisplayName } from '@/lib/utils'
import { LANGUAGE_CODES, type Category } from '@/types/common'
import type { ProductVariant } from '@/types/product'

function formatAttributeLabel(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (value) => value.toUpperCase())
}

function buildCategoryPath(category?: Category | null) {
  const segments: string[] = []
  let currentCategory: Category | null | undefined = category

  while (currentCategory) {
    segments.unshift(getDisplayName(currentCategory))
    currentCategory = currentCategory.parent ?? null
  }

  return segments.join(' / ')
}

function buildVariantFacts(variant: ProductVariant, t: (key: string, options?: Record<string, unknown>) => string) {
  const attributeEntries = Object.entries(variant.attributes ?? {})
    .filter(([, value]) => value != null && String(value).trim())
    .map(([key, value]) => [key.toLowerCase(), `${formatAttributeLabel(key)}: ${String(value)}`] as const)
  const attributeKeys = new Set(attributeEntries.map(([key]) => key))
  const facts = attributeEntries.map(([, value]) => value)

  if (variant.weight && !attributeKeys.has('weight') && !attributeKeys.has('size')) {
    facts.push(`${t('weight')}: ${formatNumber(variant.weight, 3)}`)
  }

  if (variant.unit && !attributeKeys.has('unit')) {
    facts.push(`${t('unit')}: ${getDisplayName(variant.unit, variant.unit.code)}`)
  }

  return facts
}

export function ProductDetailPage() {
  const { t } = useTranslation(['products', 'common'])
  const { id } = useParams()
  const productQuery = useProductQuery(id)
  const balancesQuery = useInventoryBalancesQuery({ page: 1, limit: 100, productId: id })
  const ledgerQuery = useInventoryLedgerQuery({ page: 1, limit: 50, productId: id })

  const ledgerItems = useMemo(() => (ledgerQuery.data?.items ?? []).slice(0, 8), [ledgerQuery.data?.items])

  if (productQuery.isLoading) {
    return <LoadingState label={t('loadingData', { ns: 'common' })} variant="detail" />
  }

  if (!productQuery.data) {
    return <EmptyState title={t('notFoundTitle')} />
  }

  const product = productQuery.data
  const categoryPath = buildCategoryPath(product.category)
  const visibleTranslations = (product.translations ?? []).filter((translation) =>
    LANGUAGE_CODES.includes(translation.language as (typeof LANGUAGE_CODES)[number]),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={getDisplayName(product)}
        description={product.displayDescription ?? product.description ?? t('noDescriptionProvided')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to={`/products/${product.id}/edit`}>{t('editProduct')}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`/inventory/adjustments/new?productId=${product.id}&variantId=${product.variants[0]?.id ?? ''}`}>{t('adjustStock')}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/purchases/new">{t('createPurchase')}</Link>
            </Button>
            <Button asChild>
              <Link to="/sales-orders/new">{t('createSalesOrder')}</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title={t('productSummaryTitle')} description={t('productSummaryDescription')}>
          <DetailGrid className="xl:grid-cols-3">
            <DetailItem label={t('sourceType')} value={<StatusBadge value={product.sourceType} />} />
            <DetailItem label={t('status', { ns: 'common' })} value={<StatusBadge value={product.status} />} />
            <DetailItem label={t('industry', { ns: 'common' })} value={product.industry ? getDisplayName(product.industry) : '—'} />
            <DetailItem label={t('category', { ns: 'common' })} value={categoryPath || '—'} />
            <DetailItem label={t('brand')} value={product.brand ? getDisplayName(product.brand, product.brand.name) : '—'} />
            <DetailItem label={t('primaryUnit')} value={product.primaryUnit ? getDisplayName(product.primaryUnit, product.primaryUnit.code) : '—'} />
            <DetailItem label={t('productType')} value={t(`typeValues.${product.productType}`, { defaultValue: product.productType })} />
            <DetailItem label={t('trackMethod')} value={t(`trackMethodValues.${product.trackMethod}`, { defaultValue: product.trackMethod })} />
          </DetailGrid>
          {product.masterCatalogItem ? (
            <InlineNotice className="mt-4" tone="success">
              {t('importedFromMasterItem')} <Link className="font-semibold underline" to={`/master-catalog/items/${product.masterCatalogItem.id}`}>{product.masterCatalogItem.canonicalName}</Link>
            </InlineNotice>
          ) : null}
        </SectionCard>

        <SectionCard title={t('translations')} description={t('translationsDescription')}>
          <InlineNotice className="mb-4">
            Review looks correct? <Link className="font-semibold underline" to={`/products/${product.id}/edit`}>Edit product</Link> to update language overrides.
          </InlineNotice>
          <div className="space-y-3">
            {visibleTranslations.map((translation) => (
              <div key={translation.language} className="rounded-md border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{translation.language}</p>
                <p className="mt-2 font-medium text-slate-900">{translation.name}</p>
                {translation.description ? <p className="mt-1 text-sm text-slate-600">{translation.description}</p> : null}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title={t('variants')} description={t('variantsSectionDescription')}>
        <DataTable
          columns={[
            {
              key: 'name',
              header: t('variant'),
              render: (variant) => {
                const facts = buildVariantFacts(variant, t)

                return (
                  <div>
                    <p className="font-medium text-slate-900">{getDisplayName(variant)}</p>
                    <p className="text-xs text-slate-500">{variant.sku}</p>
                    {facts.length ? <p className="mt-1 text-xs text-slate-500">{facts.join(' · ')}</p> : null}
                  </div>
                )
              },
            },
            {
              key: 'prices',
              header: t('prices'),
              render: (variant) => (
                <div className="text-sm text-slate-600">
                  {t('sell')}: <CurrencyText value={variant.sellingPrice} /> · {t('cost')}: <CurrencyText value={variant.costPrice} />
                  {variant.mrp ? <span> · {t('mrp')}: <CurrencyText value={variant.mrp} /></span> : null}
                </div>
              ),
            },
            {
              key: 'levels',
              header: t('levels'),
              render: (variant) => (
                <div className="text-sm text-slate-600">
                  {t('reorderLevel')} <QuantityText value={variant.reorderLevel} />
                  <span> · {t('minStock')} <QuantityText value={variant.minStockLevel} /></span>
                  {variant.maxStockLevel ? <span> · {t('maxStock')} <QuantityText value={variant.maxStockLevel} /></span> : null}
                </div>
              ),
            },
            { key: 'status', header: t('status', { ns: 'common' }), render: (variant) => <StatusBadge value={variant.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
            { key: 'actions', header: t('actions', { ns: 'common' }), render: (variant) => <Button asChild size="sm" variant="ghost"><Link to={`/products/${product.id}/variants/${variant.id}/edit`}>{t('edit', { ns: 'common' })}</Link></Button> },
          ]}
          items={product.variants}
          empty={<EmptyState title={t('noVariantsTitle')} />}
          rowKey={(variant) => variant.id}
        />
      </SectionCard>

      <SectionCard title={t('currentInventoryByBranchTitle')} description={t('currentInventoryByBranchDescription')}>
        <DataTable
          columns={[
            { key: 'branch', header: t('branch', { ns: 'common' }), render: (row) => row.branch.name },
            { key: 'variant', header: t('variant'), render: (row) => getDisplayName(row.variant) },
            { key: 'onHand', header: t('onHand', { ns: 'inventory' }), render: (row) => <QuantityText value={row.onHand} /> },
            { key: 'reserved', header: t('reserved', { ns: 'inventory' }), render: (row) => <QuantityText value={row.reserved} /> },
            { key: 'available', header: t('available', { ns: 'inventory' }), render: (row) => <QuantityText value={row.available} /> },
          ]}
          items={balancesQuery.data?.items ?? []}
          empty={<EmptyState title={t('noBranchBalancesTitle')} description={t('noBranchBalancesDescription')} />}
          rowKey={(row) => row.id}
        />
      </SectionCard>

      <SectionCard title={t('recentLedgerEntriesTitle')} description={t('recentLedgerEntriesDescription')}>
        <DataTable
          columns={[
            { key: 'date', header: t('date', { ns: 'common', defaultValue: 'Date' }), render: (entry) => formatDateTime(entry.createdAt) },
            { key: 'variant', header: t('variant'), render: (entry) => getDisplayName(entry.variant) },
            { key: 'branch', header: t('branch', { ns: 'common' }), render: (entry) => entry.branch.name },
            { key: 'movement', header: t('movement', { ns: 'products', defaultValue: 'Movement' }), render: (entry) => <StatusBadge value={entry.movementType} /> },
            { key: 'delta', header: t('delta', { ns: 'products', defaultValue: 'Delta' }), render: (entry) => <QuantityText value={entry.quantityDelta} /> },
            { key: 'reference', header: t('reference', { ns: 'products', defaultValue: 'Reference' }), render: (entry) => entry.referenceType },
          ]}
          items={ledgerItems}
          empty={<EmptyState title={t('noRecentLedgerEntriesTitle')} description={t('noRecentLedgerEntriesDescription')} />}
          rowKey={(entry) => entry.id}
        />
      </SectionCard>
    </div>
  )
}
