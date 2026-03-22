import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useIndustriesQuery, useUnitsQuery } from '@/features/meta/meta.api'
import { useMasterCatalogCategoryTreeQuery, useMasterCatalogItemQuery } from '@/features/master-catalog/master-catalog.api'
import { usePermissions } from '@/hooks/usePermissions'
import { ImportMasterItemDialog } from '@/components/master-catalog/ImportMasterItemDialog'
import { MasterCatalogCategoryDialog } from '@/components/master-catalog/MasterCatalogCategoryDialog'
import { MasterCatalogItemDialog } from '@/components/master-catalog/MasterCatalogItemDialog'
import { IndustryDialog } from '@/components/platform/IndustryDialog'
import { DataTable, DetailGrid, DetailItem, EmptyState, InlineNotice, LoadingState, PageHeader, SectionCard, StatusBadge } from '@/components/common'
import { Button } from '@/components/ui'
import { formatNumber, getDisplayName } from '@/lib/utils'
import { getLanguageLabel } from '@/lib/labels'
import { LANGUAGE_CODES } from '@/types/common'
import type { MasterCatalogCategory, MasterCatalogVariantTemplate } from '@/types/masterCatalog'

function flattenCategories(items: MasterCatalogCategory[]): MasterCatalogCategory[] {
  return items.flatMap((category) => [category, ...flattenCategories(category.children ?? [])])
}

function formatAttributeLabel(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (value) => value.toUpperCase())
}

function buildCategoryPath(category?: MasterCatalogCategory | null) {
  const segments: string[] = []
  let currentCategory: MasterCatalogCategory | null | undefined = category

  while (currentCategory) {
    segments.unshift(getDisplayName(currentCategory))
    currentCategory = currentCategory.parent ?? null
  }

  return segments.join(' / ')
}

function buildVariantTemplateFacts(template: MasterCatalogVariantTemplate) {
  const attributeEntries = Object.entries(template.attributes ?? {})
    .filter(([, value]) => value != null && String(value).trim())
    .map(([key, value]) => [key.toLowerCase(), `${formatAttributeLabel(key)}: ${String(value)}`] as const)
  const attributeKeys = new Set(attributeEntries.map(([key]) => key))
  const facts = attributeEntries.map(([, value]) => value)

  if (template.weight && !attributeKeys.has('weight') && !attributeKeys.has('size')) {
    facts.push(`Weight: ${formatNumber(template.weight, 3)}`)
  }

  if (template.unitCode && !attributeKeys.has('unit')) {
    facts.push(`Unit: ${template.unitCode}`)
  }

  return facts
}

export function MasterCatalogItemPage() {
  const { t } = useTranslation(['masterCatalog', 'common', 'products'])
  const navigate = useNavigate()
  const { id } = useParams()
  const permissions = usePermissions()
  const [importOpen, setImportOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [industryDialogOpen, setIndustryDialogOpen] = useState(false)
  const itemQuery = useMasterCatalogItemQuery(id)
  const industriesQuery = useIndustriesQuery()
  const unitsQuery = useUnitsQuery()
  const categoryTreeQuery = useMasterCatalogCategoryTreeQuery(itemQuery.data?.industryId)
  const item = itemQuery.data ?? null
  const allCategories = useMemo(
    () => flattenCategories(categoryTreeQuery.data ?? []),
    [categoryTreeQuery.data],
  )
  const industryName = useMemo(
    () => item
      ? industriesQuery.data?.find((industry) => industry.id === item.industryId)?.displayName
        ?? industriesQuery.data?.find((industry) => industry.id === item.industryId)?.name
        ?? item.industryId
      : '—',
    [industriesQuery.data, item],
  )
  const unitLabelByCode = useMemo(
    () =>
      new Map(
        (unitsQuery.data?.items ?? []).map((unit) => [
          unit.code.trim().toUpperCase(),
          getDisplayName(unit, unit.name),
        ]),
      ),
    [unitsQuery.data?.items],
  )

  if (itemQuery.isLoading) {
    return <LoadingState label={t('loadingData', { ns: 'common' })} variant="detail" />
  }

  if (!item) {
    return <EmptyState title={t('noMasterItemsTitle')} />
  }
  const defaultUnitLabel = item.defaultUnitCode?.trim()
    ? unitLabelByCode.get(item.defaultUnitCode.trim().toUpperCase()) ?? item.defaultUnitCode
    : '—'
  const categoryPath = buildCategoryPath(item.category)
  const visibleTranslations = (item.translations ?? []).filter((translation) =>
    LANGUAGE_CODES.includes(translation.language as (typeof LANGUAGE_CODES)[number]),
  )
  const visibleAliases = (item.aliases ?? []).filter((alias) =>
    LANGUAGE_CODES.includes(alias.language as (typeof LANGUAGE_CODES)[number]),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={getDisplayName(item)}
        description={item.displayDescription ?? item.canonicalDescription ?? 'No description available.'}
        actions={
          <div className="flex flex-wrap gap-2">
            {permissions.canManageMasterPlatform ? (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                {t('editMasterItem')}
              </Button>
            ) : null}
            {permissions.canManageMasterImports ? (
              <Button disabled={!item.importable && !item.alreadyImportedProductId} onClick={() => setImportOpen(true)}>
                {item.alreadyImportedProductId ? t('importAgain') : t('importItem')}
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title={t('itemSummaryTitle')} description={t('itemSummaryDescription')}>
          <DetailGrid className="xl:grid-cols-3">
            <DetailItem label={t('industry')} value={industryName} />
            <DetailItem label={t('category', { ns: 'common' })} value={categoryPath || '—'} />
            <DetailItem label={t('brand', { ns: 'products' })} value={item.defaultBrandName ?? '—'} />
            <DetailItem label={t('defaultUnit')} value={defaultUnitLabel} />
            <DetailItem label={t('trackMethod', { ns: 'products' })} value={t(`trackMethodValues.${item.defaultTrackMethod}`, { ns: 'products', defaultValue: item.defaultTrackMethod })} />
            <DetailItem label={t('productType', { ns: 'products' })} value={t(`typeValues.${item.productType}`, { ns: 'products', defaultValue: item.productType })} />
            <DetailItem label={t('importStatus')} value={<StatusBadge value={item.alreadyImportedProductId ? 'ALREADY_IMPORTED' : 'NOT_IMPORTED'} />} />
          </DetailGrid>
          {item.alreadyImportedProductId ? (
            <InlineNotice className="mt-4" tone="success">
              Already imported into this organization. <Link className="font-semibold underline" to={`/products/${item.alreadyImportedProductId}`}>Open product</Link>
            </InlineNotice>
          ) : null}
        </SectionCard>

        <SectionCard title={t('translationsAndAliases')} description={t('translationsAndAliasesDescription')}>
          <div className="space-y-3">
            {visibleTranslations.map((translation) => (
              <div key={translation.language} className="rounded-md border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{getLanguageLabel(t, translation.language)}</p>
                <p className="mt-2 font-medium text-slate-900">{translation.name}</p>
                {translation.description ? <p className="mt-1 text-sm text-slate-600">{translation.description}</p> : null}
              </div>
            ))}
            {visibleAliases.length ? (
              <InlineNotice>
                Aliases: {visibleAliases.map((alias) => `${alias.language}: ${alias.value}`).join(', ')}
              </InlineNotice>
            ) : null}
          </div>
        </SectionCard>
      </div>

      <SectionCard title={t('variantTemplatesTitle')} description={t('variantTemplatesDescription')}>
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Template',
              render: (variant) => {
                const facts = buildVariantTemplateFacts(variant)

                return (
                  <div>
                    <p className="font-medium text-slate-900">{getDisplayName(variant)}</p>
                    {facts.length ? <p className="mt-1 text-xs text-slate-500">{facts.join(' · ')}</p> : null}
                  </div>
                )
              },
            },
            { key: 'code', header: 'Code', render: (variant) => variant.code },
            {
              key: 'prices',
              header: 'Defaults',
              render: (variant) => (
                <span>
                  {variant.defaultSellingPrice ?? '—'} / {variant.defaultCostPrice ?? '—'}
                  {variant.defaultMrp ? ` / ${variant.defaultMrp}` : ''}
                </span>
              ),
            },
            { key: 'levels', header: 'Levels', render: (variant) => <span>{variant.reorderLevel} / {variant.minStockLevel}</span> },
            { key: 'status', header: 'Status', render: (variant) => <StatusBadge value={variant.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
          ]}
          items={item.variantTemplates}
          empty={<EmptyState title={t('noVariantTemplatesTitle')} description={t('noVariantTemplatesDescription')} />}
          rowKey={(variant) => variant.id}
        />
      </SectionCard>

      <ImportMasterItemDialog item={item} onOpenChange={setImportOpen} open={importOpen} />
      <MasterCatalogItemDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onAddIndustry={permissions.canManageMasterPlatform ? () => setIndustryDialogOpen(true) : undefined}
        onAddCategory={permissions.canManageMasterPlatform ? () => setCategoryDialogOpen(true) : undefined}
        onAddUnit={() => navigate('/units')}
        industries={industriesQuery.data ?? []}
        categories={allCategories}
        initialIndustryId={item.industryId}
        item={item}
      />
      <MasterCatalogCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onAddIndustry={() => setIndustryDialogOpen(true)}
        industries={industriesQuery.data ?? []}
        categories={allCategories}
        initialIndustryId={item.industryId}
      />
      <IndustryDialog open={industryDialogOpen} onOpenChange={setIndustryDialogOpen} />
    </div>
  )
}
